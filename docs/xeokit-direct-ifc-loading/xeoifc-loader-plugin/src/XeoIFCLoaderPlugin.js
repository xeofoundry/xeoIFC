import {Plugin, SceneModel, math} from "@xeokit/xeokit-sdk";

// Packed scene buffer of the xeoIFC engine ("IFCP" version 1, little endian):
// header 112 B | mesh spans 36 B | instances 96 B | elements 32 B | vertices (f32 position + normal) | indices (u32, mesh-local)
const PACK_MAGIC = 0x50434649;
const PACK_VERSION = 1;
const HEADER_WORDS = 112 / 4;
const SPAN_WORDS = 36 / 4;
const INSTANCE_WORDS = 96 / 4;
const ELEMENT_WORDS = 32 / 4;
const FLAG_VISIBLE = 1;

// The engine is Z-up like IFC; xeokit is Y-up
const Z_UP_TO_Y_UP = math.mat4([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);

/**
 * {@link Viewer} plugin that loads IFC (.ifc, .ifczip) and STEP CAD (.stp, .step) files directly, using the xeoIFC
 * WebAssembly engine in a Web Worker. No conversion step and no server are involved.
 *
 * ````javascript
 * import {Viewer} from "@xeokit/xeokit-sdk";
 * import {XeoIFCLoaderPlugin} from "@xeofoundry/xeoifc-loader-plugin";
 *
 * const viewer = new Viewer({canvasId: "myCanvas"});
 * const xeoIFCLoader = new XeoIFCLoaderPlugin(viewer);
 *
 * const sceneModel = xeoIFCLoader.load({id: "myModel", src: "Duplex.ifc", edges: true});
 * sceneModel.on("loaded", () => viewer.cameraFlight.jumpTo(sceneModel));
 *
 * const propertySets = await xeoIFCLoader.getProperties(objectId);
 * ````
 */
class XeoIFCLoaderPlugin extends Plugin {

    /**
     * @param {Viewer} viewer The Viewer.
     * @param {Object} [cfg] Plugin configuration.
     * @param {String} [cfg.id="XeoIFCLoader"] Optional ID for this plugin, so that we can find it within {@link Viewer#plugins}.
     * @param {String|URL} [cfg.workerSrc] URL of ````xeoifc.worker.js````. Only needed when the package files are served from
     * another origin than the page (a Worker must be same-origin) or moved away from each other.
     * @param {String[]} [cfg.includeTypes] Default for the ````includeTypes```` load parameter.
     * @param {String[]} [cfg.excludeTypes] Default for the ````excludeTypes```` load parameter.
     * @param {Boolean} [cfg.globalizeObjectIds=false] Default for the ````globalizeObjectIds```` load parameter.
     */
    constructor(viewer, cfg = {}) {
        super("XeoIFCLoader", viewer, cfg);
        this._workerSrc = cfg.workerSrc;
        this._includeTypes = cfg.includeTypes;
        this._excludeTypes = cfg.excludeTypes;
        this._globalizeObjectIds = !!cfg.globalizeObjectIds;
        this._worker = null;
        this._requests = new Map(); // request id -> {resolve, reject, onProgress}
        this._nextRequestId = 1;
        this._models = {}; // model id -> {sourceId, isStep, entityIds: object id -> entity id in the file}
        this._loadsInFlight = 0;
    }

    /**
     * Loads an IFC or STEP CAD file into this plugin's {@link Viewer}. The format is detected from the file content.
     *
     * Every IFC object gets its IFC GlobalId as {@link Entity#id}; objects without one (STEP solids) get
     * ````<modelId>#<entity id>````. IfcSpaces load hidden.
     *
     * @param {Object} params Loading parameters, also passed on to the {@link SceneModel} constructor (````edges````,
     * ````dtxEnabled````, ````origin````, ````position````, ````rotation````, ````scale````, ````backfaces````, ````saoEnabled````, ...).
     * @param {String} [params.id] ID to assign to the {@link SceneModel}, generated automatically by default.
     * @param {String} [params.src] URL of the file, as an alternative to ````file```` and ````data````.
     * @param {Blob} [params.file] A File (file input, drag and drop) or Blob.
     * @param {ArrayBuffer} [params.data] The file content.
     * @param {String} [params.name] File name shown as the root of a STEP model tree. Defaults to the name in ````src```` / ````file````.
     * @param {String[]} [params.includeTypes] Only load objects with these types, eg. ````["IfcWall", "IfcSlab"]````.
     * @param {String[]} [params.excludeTypes] Never load objects with these types, eg. ````["IfcSpace"]````.
     * @param {Boolean} [params.globalizeObjectIds=false] Prefix every object ID with the model ID, to load the same file twice.
     * @param {Number} [params.circleSegments=18] Number of segments the engine uses to tessellate a full circle (4..64).
     * @param {Function} [params.onProgress] Called with ````(phase, done, total)````, phases "parse", "geom" and "pack".
     * @returns {SceneModel} The model; fires "loaded" when ready and "error" when loading failed.
     */
    load(params = {}) {

        if (params.id && this.viewer.scene.components[params.id]) {
            this.error("Component with this ID already exists in viewer: " + params.id + " - will autogenerate this ID");
            delete params.id;
        }

        const sceneModel = new SceneModel(this.viewer.scene, {...params, isModel: true});

        if (!params.src && !params.file && !params.data) {
            this.error("load() param expected: src, file or data");
            return sceneModel; // Return new empty model
        }

        const spinner = this.viewer.scene.canvas.spinner;
        spinner.processes++;
        this._loadsInFlight++;

        this._getData(params)
            .then((data) => {
                const name = params.name || (params.file && params.file.name) || (params.src ? params.src.split(/[\\/]/).pop() : sceneModel.id);
                const circleSegments = params.circleSegments || 18;
                const transfer = params.data ? [] : [data]; // Never detach a buffer that belongs to the caller
                return this._request({type: "load", data, name, circleSegments}, transfer, params.onProgress);
            })
            .then((result) => {
                if (!sceneModel.destroyed) {
                    this._buildModel(sceneModel, params, result);
                }
            })
            .catch((e) => {
                this.error(e);
                sceneModel.fire("error", e);
            })
            .finally(() => {
                spinner.processes--;
                this._loadsInFlight--;
                this._clearWorkerIfUnused();
            });

        return sceneModel;
    }

    /**
     * Gets the property sets of an object from the model retained inside the WebAssembly engine.
     *
     * @param {String} objectId ID of an {@link Entity} or {@link MetaObject} loaded by this plugin.
     * @returns {Promise<{pset: String, props: {name: String, value: String, unit: String}[]}[]>} The property sets; empty when
     * the object was not loaded by this plugin.
     */
    getProperties(objectId) {
        for (const model of Object.values(this._models)) {
            const entityId = model.entityIds[objectId];
            if (entityId !== undefined) {
                return this._request({type: "properties", sourceId: model.sourceId, entityId, isStep: model.isStep})
                    .then((result) => result.json ? JSON.parse(result.json) : []);
            }
        }
        return Promise.resolve([]);
    }

    /**
     * Destroys this plugin and terminates its worker. Loaded models stay in the Viewer.
     */
    destroy() {
        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }
        this._failRequests("XeoIFCLoaderPlugin destroyed");
        super.destroy();
    }

    _getData(params) {
        if (params.data) {
            return Promise.resolve(params.data);
        }
        if (params.file) {
            return params.file.arrayBuffer();
        }
        return fetch(params.src).then((response) => {
            if (!response.ok) {
                throw `Failed to fetch ${params.src}: ${response.status} ${response.statusText}`;
            }
            return response.arrayBuffer();
        });
    }

    _request(msg, transfer = [], onProgress) {
        if (!this._worker) {
            // Literal "new Worker(new URL(..., import.meta.url))" is the form bundlers (Vite, webpack 5, ...) detect
            this._worker = this._workerSrc
                ? new Worker(this._workerSrc, {type: "module"})
                : new Worker(new URL("./xeoifc.worker.js", import.meta.url), {type: "module"});
            this._worker.onmessage = ({data: response}) => {
                const request = this._requests.get(response.id);
                if (!request) {
                    return;
                }
                if (response.type === "progress") {
                    if (request.onProgress) {
                        request.onProgress(response.phase, response.done, response.total);
                    }
                    return;
                }
                this._requests.delete(response.id);
                if (response.type === "error") {
                    request.reject(response.message);
                } else {
                    request.resolve(response);
                }
            };
            this._worker.onerror = (event) => this._failRequests("xeoIFC worker failed: " + (event.message || "could not load worker script"));
        }
        return new Promise((resolve, reject) => {
            const id = this._nextRequestId++;
            this._requests.set(id, {resolve, reject, onProgress});
            this._worker.postMessage({...msg, id}, transfer);
        });
    }

    _failRequests(message) {
        for (const request of this._requests.values()) {
            request.reject(message);
        }
        this._requests.clear();
    }

    // The engine keeps every loaded file for property queries; free them once no model of this plugin is left
    _clearWorkerIfUnused() {
        if (this._worker && this._loadsInFlight === 0 && Object.keys(this._models).length === 0) {
            this._worker.postMessage({type: "clear"});
        }
    }

    _buildModel(sceneModel, params, result) {

        const modelId = sceneModel.id;
        const includeTypes = params.includeTypes || this._includeTypes;
        const excludeTypes = params.excludeTypes || this._excludeTypes;
        const globalize = (params.globalizeObjectIds !== undefined) ? !!params.globalizeObjectIds : this._globalizeObjectIds;
        const typeLoads = (type) => (!includeTypes || includeTypes.includes(type)) && !(excludeTypes && excludeTypes.includes(type));

        const packed = result.packed;
        const u32 = new Uint32Array(packed);
        const f32 = new Float32Array(packed);
        if (u32[8] !== PACK_MAGIC || u32[9] !== PACK_VERSION) {
            throw "Unexpected geometry buffer from the xeoIFC engine";
        }
        const center = new Float64Array(packed, 0, 3); // Geometry is rebased around this point (meters)
        const origin = [center[0], center[2], -center[1]];
        const [meshCount, instanceCount, elementCount, vertexFloats] = u32.subarray(10, 14);
        const spansAt = HEADER_WORDS;
        const instancesAt = spansAt + meshCount * SPAN_WORDS;
        const elementsAt = instancesAt + instanceCount * INSTANCE_WORDS;
        const verticesAt = elementsAt + elementCount * ELEMENT_WORDS;
        const indicesAt = verticesAt + vertexFloats;

        // Object IDs and metadata from the tree

        const metaObjects = [];
        const objectIds = {}; // entity id -> object ID
        const types = {}; // entity id -> type
        const entityIds = {}; // object ID -> entity id
        const objectId = (entityId, globalId) => {
            return globalId ? (globalize ? math.globalizeObjectId(modelId, globalId) : globalId) : `${modelId}#${entityId}`;
        };
        const visit = (item, parent) => {
            const isLeaf = !item.children && !item.elements;
            types[item.entity_id] = item.type;
            if (isLeaf && !typeLoads(item.type)) {
                return;
            }
            const id = objectId(item.entity_id, item.global_id);
            objectIds[item.entity_id] = id;
            entityIds[id] = item.entity_id;
            metaObjects.push({id, name: item.name || item.type, type: item.type, parent});
            (item.children || []).forEach(child => visit(child, id));
            (item.elements || []).forEach(element => visit(element, id));
        };
        if (result.tree) {
            visit(JSON.parse(result.tree), null);
        }

        // A mesh that is instanced more than once becomes a shared geometry, the others are batched

        const useCounts = new Uint32Array(meshCount);
        for (let i = 0; i < instanceCount; i++) {
            useCounts[u32[instancesAt + i * INSTANCE_WORDS + 20]]++;
        }

        const meshGeometry = (mesh) => {
            const span = spansAt + mesh * SPAN_WORDS;
            const baseVertex = u32[span];
            const numVertices = (mesh + 1 < meshCount ? u32[span + SPAN_WORDS] : vertexFloats / 6) - baseVertex;
            const positions = new Float32Array(numVertices * 3);
            for (let v = 0, src = verticesAt + baseVertex * 6; v < numVertices; v++, src += 6) {
                positions.set(f32.subarray(src, src + 3), v * 3);
            }
            const firstIndex = indicesAt + u32[span + 1];
            return {primitive: "triangles", positions, indices: u32.slice(firstIndex, firstIndex + u32[span + 2])};
        };

        const elementLoads = new Uint8Array(elementCount);
        for (let i = 0; i < elementCount; i++) {
            elementLoads[i] = typeLoads(types[u32[elementsAt + i * ELEMENT_WORDS]]) ? 1 : 0;
        }

        const geometryCreated = new Uint8Array(meshCount);
        const entityMeshIds = Array.from({length: elementCount}, () => []);
        const entityVisible = new Uint8Array(elementCount);

        for (let i = 0; i < instanceCount; i++) {
            const instance = instancesAt + i * INSTANCE_WORDS;
            const mesh = u32[instance + 20];
            const element = u32[instance + 21];
            if (!elementLoads[element] || u32[spansAt + mesh * SPAN_WORDS + 2] === 0) {
                continue;
            }
            const meshCfg = {
                id: `${modelId}.mesh.${i}`,
                origin,
                matrix: math.mulMat4(Z_UP_TO_Y_UP, f32.subarray(instance, instance + 16), math.mat4()),
                color: f32.subarray(instance + 16, instance + 19),
                opacity: f32[instance + 19]
            };
            if (useCounts[mesh] > 1) {
                if (!geometryCreated[mesh]) {
                    geometryCreated[mesh] = 1;
                    sceneModel.createGeometry({id: `${modelId}.geometry.${mesh}`, ...meshGeometry(mesh)});
                }
                meshCfg.geometryId = `${modelId}.geometry.${mesh}`;
            } else {
                Object.assign(meshCfg, meshGeometry(mesh));
            }
            sceneModel.createMesh(meshCfg);
            entityMeshIds[element].push(meshCfg.id);
            entityVisible[element] |= u32[instance + 22] & FLAG_VISIBLE; // IfcSpaces arrive flagged hidden
        }

        for (let i = 0; i < elementCount; i++) {
            if (entityMeshIds[i].length > 0) {
                const entityId = u32[elementsAt + i * ELEMENT_WORDS];
                const id = objectIds[entityId] || objectId(entityId, null);
                entityIds[id] = entityId;
                sceneModel.createEntity({id, meshIds: entityMeshIds[i], isObject: true, visible: !!entityVisible[i]});
            }
        }

        sceneModel.finalize();

        this.viewer.metaScene.createMetaModel(modelId, {metaObjects});

        this._models[modelId] = {sourceId: result.sourceId, isStep: result.isStep, entityIds};
        sceneModel.once("destroyed", () => {
            delete this._models[modelId];
            this.viewer.metaScene.destroyMetaModel(modelId);
            this._clearWorkerIfUnused();
        });

        sceneModel.scene.once("tick", () => {
            if (sceneModel.destroyed) {
                return;
            }
            sceneModel.scene.fire("modelLoaded", modelId); // FIXME: Assumes listeners know order of these two events
            sceneModel.fire("loaded", true, false); // Don't forget the event, for late subscribers
        });
    }
}

export {XeoIFCLoaderPlugin};

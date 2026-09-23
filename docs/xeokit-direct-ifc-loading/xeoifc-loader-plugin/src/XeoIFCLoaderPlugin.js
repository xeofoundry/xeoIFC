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

// The "Evaluation version" text the engine adds to every scene; it has no type and passes the type filters
const WATERMARK_ENTITY_ID = 0xFFFFFFFF;

// Default of the maxReusedGeometries load parameter. Measured on a 670 k instance / 76 M triangle stadium (7177 reused
// geometries, RTX 4070 Laptop, frame time with edges): all shared 194 ms, 2000 -> 66 ms, 500 -> 50 ms, 150 -> 44 ms,
// none shared 250 ms (126 M instead of 26 M vertices). 500 keeps 91% of the vertices that sharing can save.
const MAX_REUSED_GEOMETRIES = 500;
const SLICE_MS = 40; // Main-thread time per slice of the scene build

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
     * @param {Boolean} [params.reuseGeometries=true] When false, no geometry is shared between meshes (like the XKTLoaderPlugin
     * option of the same name): fewest draw calls, most memory.
     * @param {Number} [params.maxReusedGeometries=500] xeokit spends one draw call per render pass on every shared geometry, so
     * only this many geometries - those whose sharing saves the most vertices - stay shared; the rest is batched.
     * @param {Number} [params.circleSegments=18] Number of segments the engine uses to tessellate a full circle (4..64).
     * @param {Function} [params.onProgress] Called with ````(phase, done, total)````, phases "read" (in MB; total 0 when
     * unknown), "parse", "geom", "pack", "edges" and "scene" (building the SceneModel, in time slices on the main thread).
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

        // The worker reads the file itself, as a stream (a File is passed by reference, a URL is fetched there), so
        // files too large for one ArrayBuffer still load. A caller's ArrayBuffer is copied, never detached.
        const source = params.data || params.file || new URL(params.src, document.baseURI).href;
        const name = params.name || (params.file && params.file.name) || (params.src ? params.src.split(/[\\/]/).pop() : sceneModel.id);
        const circleSegments = params.circleSegments || 18;

        this._request({type: "load", source, name, circleSegments}, [], params.onProgress)
            .then((result) => sceneModel.destroyed ? this._releaseSource(result.sourceId, result.isStep) : this._buildModel(sceneModel, params, result))
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
     * Loads only the metadata of an IFC file: the engine parses the file, builds no geometry and runs no CSG. The
     * geometry comes from another loader (XKT, glTF), which gets the result as its ````metaModelJSON````. The file is a full
     * IFC or the much smaller metadata IFC the xeoIFC converter writes with ````-m model.ifc````; the converter names the
     * objects of its XKT / GLB output by IFC GlobalId, like the returned metaObjects.
     *
     * ````javascript
     * const metaModelJSON = await xeoIFCLoader.loadMetadata({id: "myModel", src: "model.meta.ifc"});
     * const sceneModel = xktLoader.load({id: "myModel", src: "model.xkt", metaModelJSON});
     * const propertySets = await xeoIFCLoader.getProperties(objectId);
     * ````
     *
     * The engine keeps the parsed file for {@link XeoIFCLoaderPlugin#getProperties} until the model with this ID is
     * destroyed or {@link XeoIFCLoaderPlugin#unloadMetadata} is called, then frees it.
     *
     * @param {Object} params Loading parameters.
     * @param {String} params.id ID of the model the metadata belongs to: the ````id```` given to the geometry loader.
     * @param {String} [params.src] URL of the file, as an alternative to ````file```` and ````data````.
     * @param {Blob} [params.file] A File (file input, drag and drop) or Blob.
     * @param {ArrayBuffer} [params.data] The file content.
     * @param {String[]} [params.includeTypes] Only keep objects with these types.
     * @param {String[]} [params.excludeTypes] Drop objects with these types.
     * @param {Boolean} [params.globalizeObjectIds=false] Prefix every object ID with the model ID; set it on the geometry loader too.
     * @param {Function} [params.onProgress] Called with ````(phase, done, total)````, phases "read" (in MB) and "parse".
     * @returns {Promise<{metaObjects: {id: String, name: String, type: String, parent: String}[]}>} xeokit metamodel JSON.
     */
    loadMetadata(params = {}) {
        const modelId = params.id;
        if (!modelId) {
            return Promise.reject("loadMetadata() param expected: id");
        }
        if (!params.src && !params.file && !params.data) {
            return Promise.reject("loadMetadata() param expected: src, file or data");
        }
        const scene = this.viewer.scene;
        const spinner = scene.canvas.spinner;
        spinner.processes++;
        this._loadsInFlight++;
        const source = params.data || params.file || new URL(params.src, document.baseURI).href;
        return this._request({type: "metadata", source}, [], params.onProgress)
            .then((result) => {
                const {globalize, typeLoads} = this._filters(params);
                const {metaObjects, entityIds} = this._metaObjectsFromTree(result.tree, modelId, globalize, typeLoads);
                this.unloadMetadata(modelId);
                const onModelUnloaded = scene.on("modelUnloaded", (id) => {
                    if (id === modelId) {
                        this.unloadMetadata(modelId);
                    }
                });
                this._models[modelId] = {sourceId: result.sourceId, isStep: false, entityIds, onModelUnloaded};
                return {metaObjects};
            })
            .finally(() => {
                spinner.processes--;
                this._loadsInFlight--;
                this._clearWorkerIfUnused();
            });
    }

    /**
     * Forgets the metadata loaded with {@link XeoIFCLoaderPlugin#loadMetadata} and frees its parsed file in the engine;
     * done automatically when the model with this ID is destroyed.
     *
     * @param {String} id The ````id```` given to ````loadMetadata()````.
     */
    unloadMetadata(id) {
        const model = this._models[id];
        if (model && model.onModelUnloaded !== undefined) {
            this.viewer.scene.off(model.onModelUnloaded);
            this._releaseModel(id);
        }
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

    // The engine keeps every loaded file for property queries. A model's file is freed when the model goes
    // (_releaseModel); once no model of this plugin is left the engine is cleared as a whole, load state included.
    _clearWorkerIfUnused() {
        if (this._worker && this._loadsInFlight === 0 && Object.keys(this._models).length === 0) {
            this._worker.postMessage({type: "clear"});
        }
    }

    // Forgets a model this plugin served and frees its file in the engine. Every load has a source of its own, so
    // releasing one model never touches another's properties.
    _releaseModel(modelId) {
        const model = this._models[modelId];
        if (!model) {
            return;
        }
        delete this._models[modelId];
        this._releaseSource(model.sourceId, model.isStep);
    }

    // Frees one parsed file in the engine (also for a load whose model was destroyed before it finished)
    _releaseSource(sourceId, isStep) {
        if (this._worker) {
            this._worker.postMessage({type: "release", sourceId, isStep: !!isStep});
        }
        this._clearWorkerIfUnused();
    }

    // {globalize, typeLoads} of a load / loadMetadata call, with the plugin defaults applied
    _filters(params) {
        const includeTypes = params.includeTypes || this._includeTypes;
        const excludeTypes = params.excludeTypes || this._excludeTypes;
        return {
            globalize: (params.globalizeObjectIds !== undefined) ? !!params.globalizeObjectIds : this._globalizeObjectIds,
            typeLoads: (type) => (!includeTypes || includeTypes.includes(type)) && !(excludeTypes && excludeTypes.includes(type))
        };
    }

    // Object IDs and metadata from the engine's tree JSON
    _metaObjectsFromTree(tree, modelId, globalize, typeLoads) {
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
            // object_id: the <GlobalId>_<n> name the xeoIFC converter gives a repeated GlobalId in its XKT / GLB output
            const id = objectId(item.entity_id, item.object_id || item.global_id);
            objectIds[item.entity_id] = id;
            entityIds[id] = item.entity_id;
            metaObjects.push({id, name: item.name || item.type, type: item.type, parent});
            (item.children || []).forEach(child => visit(child, id));
            (item.elements || []).forEach(element => visit(element, id));
        };
        if (tree) {
            visit(JSON.parse(tree), null);
        }
        return {metaObjects, objectIds, types, entityIds, objectId};
    }

    async _buildModel(sceneModel, params, result) {

        const modelId = sceneModel.id;
        const {globalize, typeLoads} = this._filters(params);

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

        const {metaObjects, objectIds, types, entityIds, objectId} = this._metaObjectsFromTree(result.tree, modelId, globalize, typeLoads);

        // A mesh that is instanced more than once becomes a shared geometry, the others are batched

        const useCounts = new Uint32Array(meshCount);
        for (let i = 0; i < instanceCount; i++) {
            useCounts[u32[instancesAt + i * INSTANCE_WORDS + 20]]++;
        }

        // xeokit draws every shared geometry with a draw call of its own in each render pass, so thousands of them
        // make the frame rate draw-call bound. Only the geometries that save the most vertices stay shared.
        const numVerticesOf = (mesh) => {
            const span = spansAt + mesh * SPAN_WORDS;
            return (mesh + 1 < meshCount ? u32[span + SPAN_WORDS] : vertexFloats / 6) - u32[span];
        };
        const instanced = new Uint8Array(meshCount);
        const maxInstanced = params.reuseGeometries === false ? 0 : (params.maxReusedGeometries ?? MAX_REUSED_GEOMETRIES);
        const reused = [];
        for (let mesh = 0; mesh < meshCount; mesh++) {
            if (useCounts[mesh] > 1) {
                reused.push(mesh);
            }
        }
        const verticesSaved = (mesh) => (useCounts[mesh] - 1) * numVerticesOf(mesh);
        reused.sort((a, b) => verticesSaved(b) - verticesSaved(a));
        for (const mesh of reused.slice(0, maxInstanced)) {
            instanced[mesh] = 1;
        }

        // Positions of a mesh, transformed by `matrix` when given. Batched meshes get their matrix baked in here, not
        // passed to createMesh(): xeokit re-centers (RTC) the raw positions BEFORE applying a mesh matrix, which throws
        // meshes with large local coordinates (mm files carry their 0.001 scale in the matrix) kilometers away.
        const meshGeometry = (mesh, matrix) => {
            const span = spansAt + mesh * SPAN_WORDS;
            const baseVertex = u32[span];
            const numVertices = (mesh + 1 < meshCount ? u32[span + SPAN_WORDS] : vertexFloats / 6) - baseVertex;
            const positions = new Float32Array(numVertices * 3);
            const m = matrix || math.identityMat4();
            for (let v = 0, src = verticesAt + baseVertex * 6; v < numVertices; v++, src += 6) {
                const x = f32[src], y = f32[src + 1], z = f32[src + 2];
                positions[v * 3] = m[0] * x + m[4] * y + m[8] * z + m[12];
                positions[v * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
                positions[v * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
            }
            const firstIndex = indicesAt + u32[span + 1];
            return {
                primitive: "triangles",
                positions,
                indices: u32.slice(firstIndex, firstIndex + u32[span + 2]),
                // From the worker: xeokit's own edge generation was two thirds of the build time of a large model
                edgeIndices: result.edges.indices.slice(result.edges.offsets[mesh], result.edges.offsets[mesh + 1])
            };
        };

        // The build runs in time slices, so the page stays responsive and progress gets painted. MessageChannel, not
        // setTimeout: timers are throttled to one per second in a background tab.
        const channel = new MessageChannel();
        const nextTask = () => new Promise((resolve) => {
            channel.port1.onmessage = resolve;
            channel.port2.postMessage(0);
        });
        let sliceStart = performance.now();

        const elementLoads = new Uint8Array(elementCount);
        for (let i = 0; i < elementCount; i++) {
            const entityId = u32[elementsAt + i * ELEMENT_WORDS];
            elementLoads[i] = (entityId === WATERMARK_ENTITY_ID || typeLoads(types[entityId])) ? 1 : 0;
        }

        const geometryCreated = new Uint8Array(meshCount);
        const entityMeshIds = Array.from({length: elementCount}, () => []);
        const entityVisible = new Uint8Array(elementCount);

        for (let i = 0; i < instanceCount; i++) {
            if ((i & 63) === 0 && performance.now() - sliceStart > SLICE_MS) {
                if (params.onProgress) {
                    params.onProgress("scene", i, instanceCount);
                }
                await nextTask();
                if (sceneModel.destroyed) {
                    channel.port1.close();
                    return;
                }
                sliceStart = performance.now();
            }
            const instance = instancesAt + i * INSTANCE_WORDS;
            const mesh = u32[instance + 20];
            const element = u32[instance + 21];
            if (!elementLoads[element] || u32[spansAt + mesh * SPAN_WORDS + 2] === 0) {
                continue;
            }
            const matrix = math.mulMat4(Z_UP_TO_Y_UP, f32.subarray(instance, instance + 16), math.mat4());
            const meshCfg = {
                id: `${modelId}.mesh.${i}`,
                origin,
                color: f32.subarray(instance + 16, instance + 19),
                opacity: f32[instance + 19]
            };
            if (instanced[mesh]) {
                if (!geometryCreated[mesh]) {
                    geometryCreated[mesh] = 1;
                    sceneModel.createGeometry({id: `${modelId}.geometry.${mesh}`, ...meshGeometry(mesh)});
                }
                meshCfg.geometryId = `${modelId}.geometry.${mesh}`;
                meshCfg.matrix = matrix;
            } else {
                Object.assign(meshCfg, meshGeometry(mesh, matrix));
            }
            sceneModel.createMesh(meshCfg);
            entityMeshIds[element].push(meshCfg.id);
            entityVisible[element] |= u32[instance + 22] & FLAG_VISIBLE; // IfcSpaces arrive flagged hidden
        }

        channel.port1.close();

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
            this._releaseModel(modelId);
            this.viewer.metaScene.destroyMetaModel(modelId);
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

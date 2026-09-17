// Module worker that hosts the xeoIFC wasm modules. IFC / STEP bytes go in, a packed geometry
// buffer (transferable) plus a JSON object tree come out. The parsed model stays inside the wasm
// instance and answers property queries afterwards.

import initIfc, {worker_load, worker_properties} from "./xeoifc/viewer_wasm.js";
import initStep, {step_load, step_properties} from "./xeoifc/viewer_wasm_step.js";

let ifcReady = null; // wasm modules are fetched on first use
let stepReady = null;
let stepLoaded = false;

const onProgress = (phase, done, total) => postMessage({type: "progress", phase, done, total});

onmessage = async ({data: msg}) => {
    try {
        if (msg.type === "load") {
            const bytes = new Uint8Array(msg.data);
            let result;
            stepLoaded = /\.(stp|step)$/i.test(msg.name);
            if (stepLoaded) {
                await (stepReady ||= initStep());
                result = step_load(bytes, msg.name, true, onProgress);
            } else { // .ifc and .ifczip
                await (ifcReady ||= initIfc());
                const circleSegments = 18;
                result = worker_load(bytes, onProgress, () => {}, circleSegments, false, true, "ignore");
            }
            const packed = result.packed.buffer;
            postMessage({type: "loaded", packed, tree: result.tree, sourceId: result.sourceId}, [packed]);
        } else if (msg.type === "properties") {
            const query = stepLoaded ? step_properties : worker_properties;
            postMessage({type: "properties", objectId: msg.objectId, json: query(msg.sourceId, msg.entityId)});
        }
    } catch (e) {
        postMessage({type: "error", message: String(e)});
    }
};

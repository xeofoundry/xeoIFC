// Module worker hosting the xeoIFC wasm modules. File bytes go in, a packed geometry buffer (transferable) plus a JSON
// object tree come out. The parsed models stay inside the wasm instances and answer property queries afterwards.
//
// Requests carry an `id` that every response echoes:
//   {id, type: "load", data, name, circleSegments}  -> {id, type: "progress", phase, done, total}*
//                                                      {id, type: "loaded", packed, tree, sourceId, isStep}
//   {id, type: "properties", sourceId, entityId, isStep} -> {id, type: "properties", json}
//   {type: "clear"}                                  (no response)
//   any failure                                      -> {id, type: "error", message}

import initIfc, {worker_load, worker_properties, worker_clear_models} from "../wasm/viewer_wasm.js";
import initStep, {step_load, step_properties, step_clear_models} from "../wasm/viewer_wasm_step.js";

let ifcReady = null; // wasm modules are fetched on first use
let stepReady = null;

// IFC and STEP CAD files share the ISO 10303-21 container; the schema name tells them apart. A zip (.ifczip) has no
// readable header and takes the IFC path.
function isStepCad(bytes) {
    const head = new TextDecoder().decode(bytes.subarray(0, 65536));
    const schema = /FILE_SCHEMA\s*\(\s*\(\s*'([^']*)'/i.exec(head);
    return !!schema && !/^IFC/i.test(schema[1]);
}

onmessage = async ({data: msg}) => {
    const id = msg.id;
    try {
        if (msg.type === "load") {
            const bytes = new Uint8Array(msg.data);
            const onProgress = (phase, done, total) => postMessage({id, type: "progress", phase, done, total});
            const isStep = isStepCad(bytes);
            let result;
            if (isStep) {
                await (stepReady ||= initStep());
                result = step_load(bytes, msg.name, false, onProgress);
            } else {
                await (ifcReady ||= initIfc());
                result = worker_load(bytes, onProgress, () => {}, msg.circleSegments, false, false, "ignore");
            }
            const packed = result.packed.buffer;
            postMessage({id, type: "loaded", packed, tree: result.tree, sourceId: result.sourceId, isStep}, [packed]);
        } else if (msg.type === "properties") {
            const query = msg.isStep ? step_properties : worker_properties;
            postMessage({id, type: "properties", json: query(msg.sourceId, msg.entityId)});
        } else if (msg.type === "clear") {
            if (ifcReady) {
                await ifcReady;
                worker_clear_models();
            }
            if (stepReady) {
                await stepReady;
                step_clear_models();
            }
        }
    } catch (e) {
        postMessage({id, type: "error", message: String(e)});
    }
};

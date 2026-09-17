// Module worker hosting the xeoIFC wasm modules. A file goes in, a packed geometry buffer (transferable) plus a JSON
// object tree come out. The parsed models stay inside the wasm instances and answer property queries afterwards.
//
// The file is read here, as a stream: IFC text is fed to the engine chunk by chunk and never held as a whole, so
// multi-GB files load (a 2 GB file cannot even be read into one ArrayBuffer).
//
// Requests carry an `id` that every response echoes:
//   {id, type: "load", source, name, circleSegments}   source = absolute URL | Blob | ArrayBuffer
//                                                    -> {id, type: "progress", phase, done, total}*
//                                                       {id, type: "loaded", packed, edges, tree, sourceId, isStep}
//   {id, type: "properties", sourceId, entityId, isStep} -> {id, type: "properties", json}
//   {type: "clear"}                                    (no response)
//   any failure                                      -> {id, type: "error", message}

import initIfc, {worker_load_begin, worker_load_chunk, worker_load_finish, worker_properties, worker_clear_models} from "../wasm/viewer_wasm.js";
import initStep, {step_load, step_properties, step_clear_models} from "../wasm/viewer_wasm_step.js";
import {buildPackEdges} from "./packEdges.js";

const SNIFF_BYTES = 65536;
const MB = 1024 * 1024;

let ifcReady = null; // wasm modules are fetched on first use
let stepReady = null;

// IFC and STEP CAD files share the ISO 10303-21 container; the schema name tells them apart. A zip (.ifczip) has no
// readable header and takes the IFC path.
function isStepCad(head) {
    const schema = /FILE_SCHEMA\s*\(\s*\(\s*'([^']*)'/i.exec(new TextDecoder().decode(head));
    return !!schema && !/^IFC/i.test(schema[1]);
}

function concat(chunks, length) {
    const bytes = new Uint8Array(length);
    let at = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, at);
        at += chunk.length;
    }
    return bytes;
}

// {stream, total} of the file bytes; total is 0 when unknown
async function openSource(source) {
    if (typeof source === "string") {
        const response = await fetch(source);
        if (!response.ok) {
            throw `Failed to fetch ${source}: ${response.status} ${response.statusText}`;
        }
        return {stream: response.body, total: Number(response.headers.get("content-length")) || 0};
    }
    const blob = source instanceof Blob ? source : new Blob([source]);
    return {stream: blob.stream(), total: blob.size};
}

async function load(msg, onProgress) {
    const {stream, total} = await openSource(msg.source);
    const reader = stream.getReader();
    let done = 0;
    let lastProgress = 0;
    const read = async () => {
        const {value} = await reader.read();
        if (value) {
            done += value.length;
            if (performance.now() - lastProgress > 100) {
                lastProgress = performance.now();
                onProgress("read", Math.round(done / MB), Math.round(total / MB));
            }
        }
        return value;
    };

    // Enough of the file to see its schema
    const head = [];
    let headLength = 0;
    for (let chunk; headLength < SNIFF_BYTES && (chunk = await read());) {
        head.push(chunk);
        headLength += chunk.length;
    }

    if (isStepCad(concat(head, headLength).subarray(0, SNIFF_BYTES))) {
        for (let chunk; (chunk = await read());) { // The STEP CAD reader needs random access: whole file
            head.push(chunk);
            headLength += chunk.length;
        }
        await (stepReady ||= initStep());
        return {isStep: true, result: step_load(concat(head, headLength), msg.name, false, onProgress)};
    }

    await (ifcReady ||= initIfc());
    worker_load_begin(msg.circleSegments, false, false, "ignore");
    for (const chunk of head) {
        worker_load_chunk(chunk);
    }
    head.length = 0;
    for (let chunk; (chunk = await read());) {
        worker_load_chunk(chunk);
    }
    return {isStep: false, result: worker_load_finish(onProgress, () => {})};
}

// One request at a time: a streamed load awaits between chunks, and the engine has a single ingest slot
let queue = Promise.resolve();

onmessage = ({data: msg}) => {
    queue = queue.then(() => handle(msg));
};

async function handle(msg) {
    const id = msg.id;
    try {
        if (msg.type === "load") {
            const onProgress = (phase, done, total) => postMessage({id, type: "progress", phase, done, total});
            const {isStep, result} = await load(msg, onProgress);
            const packed = result.packed.buffer;
            onProgress("edges", 0, 1);
            const edges = buildPackEdges(packed);
            postMessage({id, type: "loaded", packed, edges, tree: result.tree, sourceId: result.sourceId, isStep},
                [packed, edges.indices.buffer, edges.offsets.buffer]);
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
}

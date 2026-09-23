<!-- Generated file: edit the source in the dev repository. sha256:b5ade1238b7abdd9 -->
# One engine, two libraries and a command-line tool

The xeoIFC crates form one Rust stack. It is built as the WebAssembly library (wasm modules with a JavaScript/TypeScript
API, for the browser), the command-line converter and the native library (`xeoifc.dll` / `libxeoifc.so`, a C ABI for any
desktop or server application: C, C++, C#, Python, Java, ...). All three sit on the same document API and the same geometry
engine; only the thin binding layer in the middle differs. Applications are hosts on the libraries: xeoIFC Web and the
xeokit loader on the WebAssembly library, xeoIFC Qt on the native library.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="integration-map-dark.svg">
  <img src="integration-map-light.svg" alt="Three builds (the WebAssembly library in the browser, the CLI, the native library with the xeoifc.dll C ABI) each go through a thin binding into the ifc-session document API, which drives the shared engine crates; renderers and the converter pipeline take the engine directly." width="1200">
</picture>

Reading the arrows: the teal arrows are the JSON wire (control only, never bulk data), the solid black arrows are Rust
calls inside one process, and the dashed paths are the direct engine paths that carry binary buffers without a session:
the packed scene going straight to a renderer, and the classic converter pipeline.

Every host talks to `ifc-session` through the same JSON op wire; the binding layer only moves strings and byte buffers
across the language boundary. Packed scenes go straight from the engine to the renderer, and the converter pipeline
still drives the engine without a session.

> **Status (September 2026).** The document API, the WebAssembly library, the C ABI and the CLI subcommands exist and
> are tested. The engine functions of the WebAssembly library run on session documents: the streamed store is adopted
> without a copy, the scene is built and the store pruned through the document, and the tree, property and georeference
> queries read the document's kept engine indexes. Its IFC export runs the split-and-merge writer over session documents,
> so the output is the same as from the CLI and the C ABI. The C ABI exposes the same wire plus background load jobs
> (progress and preview callbacks), the native renderer and the export. Each library has an open-source (MIT) reference
> host that uses nothing but the library: xeoIFC Web (TypeScript) and xeoIFC Qt (C++ with Qt Widgets).

## Load path in a viewer host

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="load-path-dark.svg">
  <img src="load-path-light.svg" alt="Viewer load sequence: stream chunks into a StepFile, adopt it with open_file, tessellate with prune, transfer the pack to the renderer; later queries and exports go through ops on the pruned store." width="1200">
</picture>

The order of operations of `worker_load_begin` / `worker_load_chunk` / `worker_load_finish`, and of a load job in the
native library. Steps 1 to 3 are one parse, one model build and one scene build; the prune before the pack keeps the wasm
heap peak low.

## What each host writes

### WebAssembly library: viewer_wasm (TypeScript, JavaScript)

`crates/viewer/wasm` builds `viewer_wasm`: one wasm module (an ES module) with JavaScript bindings and TypeScript
declarations, made by wasm-bindgen. A page instantiates it twice: a Web Worker calls the engine functions, the page
creates the `Viewer`. Control is JSON; the model crosses from the worker to the page as one transferable buffer, the packed
scene. Formats other than IFC are separate modules that the worker fetches on first use. Strings are UTF-8 JSON. A
function that fails throws the error text (the error JSON for document errors), except `worker_call`, which answers every
request with `{"ok":..}` like `xeoifc_call`. The groups:

| Group | Functions | What crosses the boundary |
|---|---|---|
| Library | `init` (default export), `version`, `licence_status` | the module instance; version JSON in the shape of `xeoifc_version`; the state of a licence key |
| Load | `worker_load_begin/chunk/finish`, `worker_load`, `worker_metadata_finish`, `worker_sharp_edges`, `worker_release_model`, `worker_clear_models`, `worker_model_count` | IFC or IFCZIP bytes in chunks (the text is never whole in memory); the packed scene, drafting lines and sharp edges as transferable buffers, the tree and the groupings as JSON; progress and preview callbacks |
| Query | `worker_element_info`, `worker_properties`, `worker_georeference` | JSON in the shapes of `xeoifc_element_query` kinds 0, 1 and 2 |
| Document API | `worker_call`, `worker_take_bytes`, `worker_edit_chunk/finish` | the JSON op wire over the loaded documents (`s<sourceId>`; editable twins `edit<sourceId>`); IFC bytes out |
| Export | `worker_export_reset/chunk/file_done/run` | source files in, entity ids per file; one merged IFC out (the split-and-merge writer) |
| Licence | `worker_set_licence_key`, `worker_save_sealed`; the key argument of `worker_export_run` | a key; until it is valid, every IFC file the module writes carries the "Evaluation version" text. `worker_save_sealed` saves a document without the text, in a form that only this engine reads (to load an edited model again) |
| Renderer | `Viewer.create(canvas)`, `set_packed_scene`, `add_packed_scene(_transformed)`, `preview_append_scene`, `frame`, `resize`, camera (`orbit`, `pan_start/to/end`, `zoom_pick`, `fit_view`, `fit_elements`, `camera_state`), `pick/pick_area/hover`, `select/select_only/set_visible/set_transparent/isolate`, line layers, sharp edges, points, terrain, clip planes, `stats` | wgpu on WebGPU into an `HTMLCanvasElement`; elements addressed by viewer handles (`set_packed_scene` returns `[entity id, handle]` pairs) |
| Formats | `viewer_wasm_jt` (`jt_load`), `viewer_wasm_step` (`step_load`), `viewer_wasm_formats` (`formats_load`: LAS/LAZ/COPC, E57, PLY, XYZ/PTS, OBJ, STL, RVM, LandXML) | a whole file, or byte ranges of a `Blob`; the same packed scene and tree as an IFC load |

A host can use any subset: the engine functions alone for a query or export page, the engine functions with its own
renderer (the xeokit loader), or all of it for a complete viewer (xeoIFC Web).

```ts
// worker.ts: the engine, in a Web Worker
import init, { worker_set_licence_key, worker_load_begin, worker_load_chunk, worker_load_finish,
  worker_properties, worker_call } from './pkg/viewer_wasm';
const ready = init();

self.onmessage = async (e: MessageEvent) => {
  await ready;
  const msg = e.data;
  if (msg.type === 'load') {
    worker_set_licence_key(msg.licenceKey, Date.now() / 1000);  // '' = evaluation: saved IFC carries the text
    worker_load_begin(18, true, true, 'ignore');  // circle segments, sharp edges, replace loaded models, orphans
    const reader = (msg.file as File).stream().getReader();
    for (let r = await reader.read(); !r.done; r = await reader.read()) worker_load_chunk(r.value);
    const out = worker_load_finish(
      (phase: string, done: number, total: number) => postMessage({ phase, done, total }),  // "parse", "geom", "pack"
      (preview: Uint8Array) => postMessage({ preview }, [preview.buffer]));                // the scene so far
    postMessage({ packed: out.packed, tree: out.tree, sourceId: out.sourceId }, [out.packed.buffer]);
  } else if (msg.type === 'properties') {
    postMessage({ properties: worker_properties(msg.sourceId, msg.entityId) });  // JSON; undefined for an unknown sourceId
  } else if (msg.type === 'call') {
    postMessage({ response: worker_call(msg.request) });  // the same ops and error codes as the CLI and the C ABI
  }
};

// main.ts: the renderer, on the page
import init, { Viewer } from './pkg/viewer_wasm';
await init();
const viewer = await Viewer.create(canvas);  // canvas.width and canvas.height in device pixels
let handles = new Uint32Array();  // [entity id, handle, entity id, handle, ...]
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
worker.onmessage = (e) => {
  if (e.data.preview) viewer.set_packed_scene(e.data.preview);
  if (e.data.packed) {
    handles = viewer.set_packed_scene(e.data.packed);
    worker.postMessage({ type: 'call', request: JSON.stringify({ op: 'query.select', doc: `s${e.data.sourceId}`,
      args: { text: 'is IfcWall and Pset_WallCommon.IsExternal = true', includeRefs: true } }) });
  }
  if (e.data.response) console.log(JSON.parse(e.data.response));  // {"ok":true,"result":{"items":[..],"refs":["#1022",..],..}}
};
worker.postMessage({ type: 'load', file, licenceKey: '' });

const draw = () => { viewer.frame(); requestAnimationFrame(draw); };  // renders only after a change
requestAnimationFrame(draw);
canvas.onclick = async (e) => {
  const handle = await viewer.pick(Math.round(e.offsetX * devicePixelRatio), Math.round(e.offsetY * devicePixelRatio));
  if (handle !== undefined) viewer.select(handle, e.ctrlKey);  // undefined = background
};
```

- Built by `npm run wasm` (wasm-pack, one module per format).
- xeoIFC Web (`web/`) is the reference host: about 16,600 lines of TypeScript that use nothing but these modules;
  `src/worker.ts` is its whole bridge to the engine. It is open source (MIT) and ships as `xeoifc-web-source.zip` with the
  prebuilt modules.
- The xeokit loader (`@xeofoundry/xeoifc-loader-plugin`) is a second host: its worker calls the load, query and release
  functions and turns the packed scene into a xeokit `SceneModel`; it does not use the `Viewer`. Its build of the module
  draws the "Evaluation version" text into every scene.
- Each wasm instance has at most 4 GiB. The viewer's documents are pruned to metadata after tessellation; an export reads
  the source files again into a worker of its own (full stores), which the host terminates afterwards.

### CLI (shell, scripts, agents)

The legacy flags keep the converter pipeline. Subcommands and the MCP server run the document API in-process.

```text
xeoifc -i model.ifc -o model.glb -m model_meta.ifc

xeoifc query model.ifc "is IfcWall and within(#210)"
xeoifc split model.ifc --refs 2O2Fr$t4X7Zf8NOew3FLKn -o wall.ifc
xeoifc merge a.ifc b.ifc -o merged.ifc
xeoifc run script.json      # batch of ops, dryRun aware

xeoifc serve --mcp --root E:/work/ifcFiles
# MCP client: ifc_open, ifc_query, ifc_edit, ifc_save ...
```

- One executable, no runtime dependencies.
- Paths are sandboxed to the `--root` directories.

### Native library: xeoifc.dll (C ABI, any language)

`crates/xeoifc-c` builds `xeoifc.dll` (`libxeoifc.so`, `libxeoifc.dylib`) with one plain C header, `xeoifc.h`. Any
program that can call C loads it: C++, C# (P/Invoke), Python (ctypes), Delphi, Java (JNA); desktop GUI applications and
headless server processes alike. Every function is thread-compatible and never throws; strings are UTF-8 JSON owned by the
caller until the matching `xeoifc_free_*`. The header has six groups:

| Group | Functions | What crosses the boundary |
|---|---|---|
| Library | `xeoifc_version`, `xeoifc_free_string/bytes/floats/u32` | version JSON; frees for every buffer the DLL hands out |
| Session | `xeoifc_session_new/free/set_roots`, `xeoifc_call`, `xeoifc_open_bytes`, `xeoifc_save_bytes`, `xeoifc_take_bytes`, `xeoifc_take_events`, `xeoifc_last_error` | the JSON op wire, IFC bytes in and out, observe events |
| Export | `xeoifc_export` | `[{docId, selection}]` in, one merged IFC out (the split-and-merge writer) |
| Licence | `xeoifc_set_licence_key` | a key; until it is valid, every IFC file the session writes (`xeoifc_export`, `xeoifc_save_bytes`, `document.save`, `document.exportSubset`) carries the "Evaluation version" text |
| Load jobs | `xeoifc_load_start`, `xeoifc_job_poll`, `xeoifc_job_take_pack/lines/edges`, `xeoifc_element_query`, `xeoifc_job_cancel/free` | a background parse + tessellate with progress and preview callbacks; packed scene, drafting lines and sharp edges as buffers; tree, properties and georeference as JSON |
| Renderer | `xeoifc_viewer_create/free/resize/frame`, `set_scene/preview/clear`, camera (`orbit`, `pan_start/to/end`, `anchor_pick`, `zoom`, `fit_*`, `camera_state`), `pick/pick_area/hover`, `set_selection/visible/transparent`, line layers, sharp edges, background, stats | wgpu drawing into a host window handle (HWND, X11 window, NSView); elements addressed as `(scene, entity)` pairs |

A host can use any subset: the session alone for a headless query or edit service, session + jobs + its own
renderer, or all of them for a complete viewer.

```c
#include <xeoifc.h>

XeoIfcSession* s = xeoifc_session_new();
xeoifc_session_set_roots(s, "[\"E:/projects\"]");

/* the wire: same ops and error codes as the WebAssembly library and the CLI */
char* out = xeoifc_call(s,
  "{\"op\":\"query.select\",\"doc\":\"d1\","
  "\"args\":{\"text\":\"is IfcWall and within(#210)\"}}");
xeoifc_free_string(out);

/* a load job: parse + tessellate on a DLL thread, callbacks report progress */
XeoIfcJob* job = xeoifc_load_start(s, "E:/projects/a.ifc", NULL, NULL);
while (xeoifc_job_poll(s, job, NULL) == 0) { /* pump the GUI, ~30 ms */ }
uint8_t* pack; size_t n;
xeoifc_job_take_pack(job, &pack, &n);

/* the renderer: draw into a native child window, then xeoifc_viewer_frame on a ~16 ms timer */
XeoIfcViewer* v = xeoifc_viewer_create(hwnd, NULL, w, h, NULL);
xeoifc_viewer_set_scene(v, pack, n, 0, NULL);
xeoifc_free_bytes(pack, n);
xeoifc_job_free(job);
```

- xeoIFC Qt (`apps/xeoifc-qt`, MIT) is the reference host: a C++ Qt Widgets application in which the DLL parses, tessellates and
  renders into a native child window while the Qt side owns the ribbon, tree, properties and dialogs. It uses no
  Rust and no engine crate directly, so it doubles as the compatibility test of the header.
- Rust hosts do not need the C layer: they link `ifc-session`, `ifc-geom` and `viewer-render` directly and make the
  same calls (the in-tree `crates/viewer/qt` cxx-qt viewer does).
- The DLL carries the whole engine, so a native host has no wasm 4 GiB cap and no prune requirement; `retainFull`
  keeps documents editable.

## What stays shared, what differs

| Concern | WebAssembly library | CLI | Native library (xeoifc.dll) |
|---|---|---|---|
| Parse and store | step-core, streamed chunks in the worker | step-core, whole file | step-core on the job thread, or bytes via xeoifc_open_bytes |
| Document API | worker_call over the loaded documents (wasm-bindgen) | ifc_session::Session in-process, MCP over stdio | xeoifc_call over the C ABI, from any language |
| Geometry | ifc-geom in worker_load_finish (tessellate with prune), pack transferred to the page | ifc-geom via the converter pipeline (GLB) or the session (jobs) | ifc-geom in the load job; pack handed to the host or to the DLL's renderer |
| Rendering | viewer-render on WebGPU (the Viewer class) | none (files out) | viewer-render on Vulkan / DX12 / Metal into a host window handle (HWND, X11, NSView) |
| Memory model | prune after tessellation, 4 GiB wasm cap | process memory, no prune needed | process memory; retainFull or prune per document |
| Clock and randomness | installed from JS (Date.now, Math.random) | std | std |
| Security | bytes in, bytes out; no filesystem | filesystem roots, permissions | filesystem roots, permissions; bytes-only use needs no roots |
| Licence key | worker_set_licence_key; the key argument of worker_export_run | --license-key, XEO_IFC_LICENSE_KEY, config file | xeoifc_set_licence_key |
| Reference host | xeoIFC Web (TypeScript, MIT); the xeokit loader | - | xeoIFC Qt (C++, MIT) |

---

Powered by xeoFoundry - [www.xeofoundry.com](https://xeofoundry.com)

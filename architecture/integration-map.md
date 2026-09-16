# One library, three hosts

The xeoIFC crates form one Rust stack. A browser viewer, the command-line converter and a native Qt application all
sit on the same document API and the same geometry engine; only the thin binding layer in the middle differs per host.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="integration-map-dark.svg">
  <img src="integration-map-light.svg" alt="Three host applications (browser wasm viewer, CLI, Qt app) each go through a thin binding into the ifc-session document API, which drives the shared engine crates; renderers and the converter pipeline take the engine directly." width="1200">
</picture>

Reading the arrows: the teal arrows are the JSON wire (control only, never bulk data), the solid black arrows are Rust
calls inside one process, and the dashed paths are the direct engine paths that carry binary buffers without a session:
the packed scene going straight to a renderer, and the classic converter pipeline.

Every host talks to `ifc-session` through the same JSON op wire; the binding layer only moves strings and byte buffers
across the language boundary. Packed scenes go straight from the engine to the renderer, and the converter pipeline
still drives the engine without a session.

> **Status (September 2026).** The document API, the wasm `IfcSession`, the C ABI and the CLI subcommands exist and
> are tested. The browser viewer's worker runs on session documents: the streamed store is adopted without a copy,
> the scene is built and the store pruned through the document, and the tree, property and georeference queries read
> the document's kept engine indexes. Its IFC export runs the split-and-merge writer over session documents, so the
> output is unchanged. The Qt application's load thread does the same on a full-retain document and exposes the wire
> to QML as `apiCall`.

## Load path in a viewer host

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="load-path-dark.svg">
  <img src="load-path-light.svg" alt="Viewer load sequence: stream chunks into a StepFile, adopt it with open_file, tessellate with prune, transfer the pack to the renderer; later queries and exports go through ops on the pruned store." width="1200">
</picture>

The viewer's order of operations, expressed as session calls. Steps 1 to 3 cost the same as the current worker: one
parse, one model build, one scene build, and the prune before the pack keeps the wasm heap peak where it is today.

## What each host writes

### WASM viewer (TypeScript)

The worker owns an `IfcSession`; the main thread owns the `Viewer`. Control is JSON, bulk data crosses as
transferable buffers.

```ts
import init, { IfcSession } from './pkg/viewer_wasm';
await init();
const s = new IfcSession();
const doc = s.openBytes(bytes, 'Duplex.ifc', true);
const r = JSON.parse(s.call(JSON.stringify({
  op: 'geometry.tessellate',
  args: { prune: true } })));
const packed = s.takeBytes();
post({ type: 'loaded', packed }, [packed.buffer]);
// later, from the tree panel:
s.call('{"op":"spatial.tree","args":{"depth":2}}');
```

- Built by `npm run wasm` (wasm-pack, one module per format).
- The session code adds 0.44 MB gzipped to the viewer bundle.

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

### Qt application (C++ or Rust)

Link the crates directly through the cxx-qt bridge, or load `xeoifc_api.dll` from any C++ or C# code base and speak
the same wire.

```c
#include "xeoifc_api.h"

XeoIfcSession* s = xeoifc_session_new();
xeoifc_session_set_roots(s, "[\"E:/projects\"]");
char* out = xeoifc_call(s,
  "{\"op\":\"document.open\","
  "\"args\":{\"path\":\"E:/projects/a.ifc\"}}");
xeoifc_free_string(out);
out = xeoifc_call(s,
  "{\"op\":\"geometry.tessellate\","
  "\"args\":{\"prune\":true}}");
uint8_t* pack; size_t n;
if (xeoifc_take_bytes(s, &pack, &n) == 0) {
  viewport.upload(pack, n);   /* viewer-render, wgpu */
  xeoifc_free_bytes(pack, n);
}
xeoifc_free_string(out);
xeoifc_session_free(s);
```

- Header `xeoifc_api.h`, generated from the Rust extern functions.
- The in-tree Qt viewer keeps its Rust loader thread; the same calls apply there without the C layer.

## What stays shared, what differs

| Concern | WASM viewer | CLI | Qt app |
|---|---|---|---|
| Parse and store | step-core, streamed chunks in the worker | step-core, whole file | step-core, loader thread |
| Document API | IfcSession (wasm-bindgen) | ifc_session::Session in-process, MCP over stdio | Rust crates or xeoifc_api.dll |
| Geometry | ifc-geom via geometry.tessellate, pack transferred | ifc-geom via the converter pipeline (GLB) or the session (jobs) | ifc-geom, pack kept in memory |
| Rendering | viewer-render on WebGPU | none (files out) | viewer-render on Vulkan / DX12 through a Qt window handle |
| Memory model | prune after tessellation, 4 GiB wasm cap | process memory, no prune needed | process memory; prune optional |
| Clock and randomness | installed from JS (Date.now, Math.random) | std | std |
| Security | bytes in, bytes out; no filesystem | filesystem roots, permissions | filesystem roots, permissions |

---

Powered by xeoFoundry - [www.xeofoundry.com](https://xeofoundry.com)

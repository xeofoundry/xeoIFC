/* @ts-self-types="./viewer_wasm.d.ts" */

export class Viewer {
    static __wrap(ptr) {
        const obj = Object.create(Viewer.prototype);
        obj.__wbg_ptr = ptr;
        ViewerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ViewerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_viewer_free(ptr, 0);
    }
    /**
     * Append drafting lines of the last uploaded scene to `layer` (xyz xyz pairs, scene-rebased):
     * 0 axis, 1 footprint, 2 plan, 3 annotation, 4 grid.
     * `owners` = entity id owning each pair. Lines follow `set_element_offsets` of their owner; owners without
     * a mesh (annotations, grids) get a viewer handle here, returned as `[entity id, handle, ...]` pairs.
     * @param {number} layer
     * @param {Float32Array} data
     * @param {Uint32Array} owners
     * @returns {Uint32Array}
     */
    add_line_layer(layer, data, owners) {
        const ptr0 = passArray32ToWasm0(owners, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.viewer_add_line_layer(this.__wbg_ptr, layer, data, ptr0, len0);
        return ret;
    }
    /**
     * Add another packed scene to the current render view.
     * @param {Uint8Array} data
     * @returns {Uint32Array}
     */
    add_packed_scene(data) {
        const ret = wasm.viewer_add_packed_scene(this.__wbg_ptr, data);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Uint8Array} data
     * @param {Float64Array} placement
     * @returns {Uint32Array}
     */
    add_packed_scene_transformed(data, placement) {
        const ret = wasm.viewer_add_packed_scene_transformed(this.__wbg_ptr, data, placement);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Append one chunk of point-cloud records to the last uploaded scene: 16 bytes per point,
     * f32 xyz relative to that scene's pack center + sRGB rgba8. Points are not pickable.
     * @param {Uint8Array} data
     */
    add_points(data) {
        wasm.viewer_add_points(this.__wbg_ptr, data);
    }
    /**
     * Refresh the orbit/zoom anchor from the surface under `(x, y)`
     * (physical px). A miss keeps the last anchor.
     * @param {number} x
     * @param {number} y
     */
    anchor(x, y) {
        wasm.viewer_anchor(this.__wbg_ptr, x, y);
    }
    /**
     * Refresh the orbit/zoom anchor only while orbit still falls back to
     * the fitted AABB center.
     * @param {number} x
     * @param {number} y
     */
    anchor_if_bbox_center(x, y) {
        wasm.viewer_anchor_if_bbox_center(this.__wbg_ptr, x, y);
    }
    /**
     * Refresh the orbit/zoom anchor with the mesh or terrain point under
     * `(x, y)` (physical px). Resolves to `true` when it set one.
     * @param {number} x
     * @param {number} y
     * @returns {Promise<any>}
     */
    anchor_pick(x, y) {
        const ret = wasm.viewer_anchor_pick(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * Announce a new model load: the next `set_packed_scene` frames the model, and the mid-load
     * snapshots keep re-framing until the user moves the camera (after that the view is theirs).
     */
    begin_load() {
        wasm.viewer_begin_load(this.__wbg_ptr);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    begin_view_direction_animation(x, y, z) {
        const ret = wasm.viewer_begin_view_direction_animation(this.__wbg_ptr, x, y, z);
        return ret !== 0;
    }
    /**
     * Current camera axes as JSON for DOM overlays such as the nav cube.
     * @returns {string}
     */
    camera_axes() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.viewer_camera_axes(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Orbit camera snapshot (9 floats, empty when no camera yet); see `Renderer::camera_state`.
     * @returns {Float32Array}
     */
    camera_state() {
        const ret = wasm.viewer_camera_state(this.__wbg_ptr);
        return ret;
    }
    cancel_view_animation() {
        wasm.viewer_cancel_view_animation(this.__wbg_ptr);
    }
    clear_element_tints() {
        wasm.viewer_clear_element_tints(this.__wbg_ptr);
    }
    /**
     * Drop the hover highlight (pointer left the canvas, drag started).
     */
    clear_hover() {
        wasm.viewer_clear_hover(this.__wbg_ptr);
    }
    clear_preview_scene() {
        wasm.viewer_clear_preview_scene(this.__wbg_ptr);
    }
    clear_scene() {
        wasm.viewer_clear_scene(this.__wbg_ptr);
    }
    clear_selection() {
        wasm.viewer_clear_selection(this.__wbg_ptr);
    }
    clear_sharp_edges() {
        wasm.viewer_clear_sharp_edges(this.__wbg_ptr);
    }
    clear_terrain() {
        wasm.viewer_clear_terrain(this.__wbg_ptr);
    }
    /**
     * Async constructor: adapter/device setup + surface configuration.
     * @param {HTMLCanvasElement} canvas
     * @returns {Promise<Viewer>}
     */
    static create(canvas) {
        const ret = wasm.viewer_create(canvas);
        return ret;
    }
    /**
     * Return the world-space model/terrain hit point under `(x, y)`, if any.
     * @param {number} x
     * @param {number} y
     * @returns {Promise<any>}
     */
    cursor_world_point(x, y) {
        const ret = wasm.viewer_cursor_world_point(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * @param {Uint32Array} handles
     * @returns {string}
     */
    element_bounds(handles) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.viewer_element_bounds(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Triangles of one element, nine floats each, in the space of `camera_state` (display offsets included). Read
     * back from the GPU on demand; empty for an unknown, hidden or very large element.
     * @param {number} handle
     * @returns {Promise<any>}
     */
    element_triangles(handle) {
        const ret = wasm.viewer_element_triangles(this.__wbg_ptr, handle);
        return ret;
    }
    /**
     * Frame one or more viewer element handles. An empty list frames the whole model.
     * @param {Uint32Array} handles
     */
    fit_elements(handles) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_fit_elements(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Re-frame the model, keeping the current orientation.
     */
    fit_view() {
        wasm.viewer_fit_view(this.__wbg_ptr);
    }
    /**
     * Render one frame if anything is dirty (damage-based — idle frames
     * cost nothing). Returns whether a frame was actually rendered.
     * @returns {boolean}
     */
    frame() {
        const ret = wasm.viewer_frame(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * Hover-highlight the element under `(x, y)` (physical px): a slight
     * tint plus an edge overlay, cleared when the cursor leaves geometry.
     * Resolves to the hovered element's handle, or `undefined`. Unlike
     * `pick`, this never touches the orbit/pan anchors.
     * @param {number} x
     * @param {number} y
     * @returns {Promise<any>}
     */
    hover(x, y) {
        const ret = wasm.viewer_hover(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    is_orthographic() {
        const ret = wasm.viewer_is_orthographic(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Re-frame the model from the canonical isometric direction.
     */
    iso_view() {
        wasm.viewer_iso_view(this.__wbg_ptr);
    }
    /**
     * @param {Uint32Array} handles
     */
    isolate(handles) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_isolate(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Further models of a batch load: uploads keep the current camera (frame once, after the last one).
     */
    keep_camera() {
        wasm.viewer_keep_camera(this.__wbg_ptr);
    }
    /**
     * @param {number} dx
     * @param {number} dy
     */
    orbit(dx, dy) {
        wasm.viewer_orbit(this.__wbg_ptr, dx, dy);
    }
    /**
     * @param {number} dx
     * @param {number} dy
     */
    pan(dx, dy) {
        wasm.viewer_pan(this.__wbg_ptr, dx, dy);
    }
    pan_end() {
        wasm.viewer_pan_end(this.__wbg_ptr);
    }
    /**
     * Capture the rendered surface point under the cursor for exact pan
     * locking. Resolves to `true` when the gesture has a surface anchor.
     * @param {number} x
     * @param {number} y
     * @returns {Promise<any>}
     */
    pan_start(x, y) {
        const ret = wasm.viewer_pan_start(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * Pan to the current cursor position, using the active pan anchor when
     * one was captured; otherwise falls back to delta panning.
     * @param {number} x
     * @param {number} y
     * @param {number} dx
     * @param {number} dy
     */
    pan_to(x, y, dx, dy) {
        wasm.viewer_pan_to(this.__wbg_ptr, x, y, dx, dy);
    }
    /**
     * Pick the element at `(x, y)`: renders the on-demand id/depth pass,
     * anchors orbit to that rendered hit, and resolves to the element's
     * stable viewer handle, or `undefined` for background.
     * @param {number} x
     * @param {number} y
     * @returns {Promise<any>}
     */
    pick(x, y) {
        const ret = wasm.viewer_pick(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * Every distinct element inside the pixel rect, as stable viewer
     * handles: one scissored id pass + one readback, so even one-pixel
     * slivers inside the rect are found.
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @returns {Promise<any>}
     */
    pick_area(x, y, w, h) {
        const ret = wasm.viewer_pick_area(this.__wbg_ptr, x, y, w, h);
        return ret;
    }
    /**
     * Element and surface point under `(x, y)` for measuring: `[handle, x, y, z]` in the space of `camera_state`,
     * or `undefined` for background. Unlike `pick`, it leaves the orbit anchor alone.
     * @param {number} x
     * @param {number} y
     * @returns {Promise<any>}
     */
    pick_hit(x, y) {
        const ret = wasm.viewer_pick_hit(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * Replace the temporary append-mode loading preview without registering
     * selectable element handles.
     * @param {Uint8Array} data
     */
    preview_append_scene(data) {
        const ret = wasm.viewer_preview_append_scene(this.__wbg_ptr, data);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Ray into the displayed scene (walk mode collision and gravity): resolves to `[distance, handle]` in metres, or
     * `undefined` when the ray hits nothing. `origin` is in the space of `camera_state`.
     * @param {number} ox
     * @param {number} oy
     * @param {number} oz
     * @param {number} dx
     * @param {number} dy
     * @param {number} dz
     * @returns {Promise<any>}
     */
    probe(ox, oy, oz, dx, dy, dz) {
        const ret = wasm.viewer_probe(this.__wbg_ptr, ox, oy, oz, dx, dy, dz);
        return ret;
    }
    /**
     * Request a canvas redraw even when only surrounding DOM changed.
     */
    repaint() {
        wasm.viewer_repaint(this.__wbg_ptr);
    }
    /**
     * `width`/`height` are CSS pixels; physical size = CSS × dpr.
     * @param {number} width
     * @param {number} height
     * @param {number} dpr
     */
    resize(width, height, dpr) {
        wasm.viewer_resize(this.__wbg_ptr, width, height, dpr);
    }
    /**
     * Rebased and source-space bounds for the loaded render scene.
     * @returns {string}
     */
    scene_bounds() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.viewer_scene_bounds(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Select an element by viewer handle; `additive` (ctrl-click) toggles it
     * within the existing selection. Returns false for unknown ids.
     * @param {number} handle
     * @param {boolean} additive
     * @returns {boolean}
     */
    select(handle, additive) {
        const ret = wasm.viewer_select(this.__wbg_ptr, handle, additive);
        return ret !== 0;
    }
    /**
     * Replace the whole selection in one call (area selection): one
     * selection-buffer upload instead of one per element.
     * @param {Uint32Array} handles
     */
    select_only(handles) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_select_only(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {Uint32Array}
     */
    selected_handles() {
        const ret = wasm.viewer_selected_handles(this.__wbg_ptr);
        return ret;
    }
    /**
     * Set the viewer background color. Components are sRGB in the 0..1 range.
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    set_background_color(r, g, b) {
        wasm.viewer_set_background_color(this.__wbg_ptr, r, g, b);
    }
    /**
     * Apply a `camera_state` snapshot; `false` when rejected.
     * @param {Float32Array} state
     * @returns {boolean}
     */
    set_camera_state(state) {
        const ret = wasm.viewer_set_camera_state(this.__wbg_ptr, state);
        return ret !== 0;
    }
    /**
     * Section planes, `xyzw` each, in the space of `camera_state`: `dot(xyz, p) + w > 0` is cut away.
     * At most six are used; an empty array switches clipping off.
     * @param {Float32Array} planes
     */
    set_clip_planes(planes) {
        wasm.viewer_set_clip_planes(this.__wbg_ptr, planes);
    }
    /**
     * Walk mode: fade elements - 0 = as they are, 1..9 = tenths of transparency.
     * @param {Uint32Array} handles
     * @param {number} level
     */
    set_element_fade(handles, level) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_set_element_fade(this.__wbg_ptr, ptr0, len0, level);
    }
    /**
     * Lab heat flow: colour elements by a heat level instead of their model colour - one level per handle, 0 = model
     * colour again, 1..254 = cold..hot gradient, 255 = neutral grey. Empty lists clear every level.
     * @param {Uint32Array} handles
     * @param {Uint8Array} levels
     */
    set_element_heat(handles, levels) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(levels, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.viewer_set_element_heat(this.__wbg_ptr, ptr0, len0, ptr1, len1);
    }
    /**
     * Shift elements to absolute display offsets: `offsets` holds one xyz triple per handle.
     * Handles without geometry are skipped together with their triple.
     * @param {Uint32Array} handles
     * @param {Float32Array} offsets
     */
    set_element_offsets(handles, offsets) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(offsets, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.viewer_set_element_offsets(this.__wbg_ptr, ptr0, len0, ptr1, len1);
    }
    /**
     * `set_element_offsets` with a tilt (fall easter egg): `values` holds 8 floats per handle - offset xyz, pivot xyz
     * (unshifted, in the space of `element_bounds`), heading and angle in radians. The element turns by the angle about
     * the horizontal axis at the heading through the pivot, then takes the offset; angle 0 clears its tilt.
     * @param {Uint32Array} handles
     * @param {Float32Array} values
     */
    set_element_tilted_offsets(handles, values) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(values, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.viewer_set_element_tilted_offsets(this.__wbg_ptr, ptr0, len0, ptr1, len1);
    }
    /**
     * World-space (metres, not rebased) bounds of each handle's element as they are displayed, JSON
     * `[[minx,miny,minz,maxx,maxy,maxz] | null, ...]` in handle order.
     * Tint elements with a palette colour (model compare, colour by property): 1 green, 2 red, 3 orange, 4 blue,
     * 5 purple, 6 faint grey ghost (for elements that are also set transparent), 7..15 more hues (see main.wgsl);
     * 0 removes it.
     * @param {Uint32Array} handles
     * @param {number} tint
     */
    set_element_tint(handles, tint) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_set_element_tint(this.__wbg_ptr, ptr0, len0, tint);
    }
    /**
     * Vertical field of view of the camera in degrees (45 by default).
     * @param {number} degrees
     */
    set_field_of_view(degrees) {
        wasm.viewer_set_field_of_view(this.__wbg_ptr, degrees);
    }
    /**
     * @param {number} layer
     * @param {boolean} visible
     */
    set_line_layer_visible(layer, visible) {
        wasm.viewer_set_line_layer_visible(this.__wbg_ptr, layer, visible);
    }
    /**
     * Parallel (orthographic) projection on or off. The view height in metres is `2 * distance * tan(22.5 deg)`,
     * `distance` being `camera_state()[3]`, so zooming and `set_camera_state` keep working.
     * @param {boolean} ortho
     */
    set_orthographic(ortho) {
        wasm.viewer_set_orthographic(this.__wbg_ptr, ortho);
    }
    /**
     * Upload a packed scene produced by `worker_load` (transferred from the
     * worker). The buffer is parsed, uploaded to the GPU and dropped.
     * @param {Uint8Array} data
     * @returns {Uint32Array}
     */
    set_packed_scene(data) {
        const ret = wasm.viewer_set_packed_scene(this.__wbg_ptr, data);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Uint8Array} data
     * @param {Float64Array} placement
     * @returns {Uint32Array}
     */
    set_packed_scene_transformed(data, placement) {
        const ret = wasm.viewer_set_packed_scene_transformed(this.__wbg_ptr, data, placement);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Walk mode: probe rays pass through these elements (doors, windows) - or stop at them again.
     * @param {Uint32Array} handles
     * @param {boolean} passable
     */
    set_probe_passable(handles, passable) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_set_probe_passable(this.__wbg_ptr, ptr0, len0, passable);
    }
    /**
     * Upload optional sharp-edge overlay line positions, as xyz xyz pairs, with the element index of each pair.
     * @param {Float32Array} data
     * @param {Uint32Array} elements
     */
    set_sharp_edges(data, elements) {
        const ptr0 = passArray32ToWasm0(elements, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_set_sharp_edges(this.__wbg_ptr, data, ptr0, len0);
    }
    /**
     * @param {boolean} visible
     */
    set_sharp_edges_visible(visible) {
        wasm.viewer_set_sharp_edges_visible(this.__wbg_ptr, visible);
    }
    /**
     * Upload non-pickable terrain guide lines, as xyz xyz pairs.
     * @param {Float32Array} data
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    set_terrain_lines(data, r, g, b, a) {
        wasm.viewer_set_terrain_lines(this.__wbg_ptr, data, r, g, b, a);
    }
    /**
     * Upload terrain triangles used only for camera anchors and coordinate readout.
     * @param {Float32Array} data
     */
    set_terrain_pick_triangles(data) {
        wasm.viewer_set_terrain_pick_triangles(this.__wbg_ptr, data);
    }
    /**
     * Upload non-selectable terrain guide triangles, as xyz xyz xyz triplets.
     * @param {Float32Array} data
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    set_terrain_triangles(data, r, g, b, a) {
        wasm.viewer_set_terrain_triangles(this.__wbg_ptr, data, r, g, b, a);
    }
    /**
     * @param {Uint32Array} handles
     * @param {boolean} transparent
     */
    set_transparent(handles, transparent) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_set_transparent(this.__wbg_ptr, ptr0, len0, transparent);
    }
    /**
     * Set visibility for a list of viewer handles. Unknown/non-geometric ids
     * are deliberately harmless: tree nodes can contain both kinds.
     * @param {Uint32Array} handles
     * @param {boolean} visible
     */
    set_visible(handles, visible) {
        const ptr0 = passArray32ToWasm0(handles, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.viewer_set_visible(this.__wbg_ptr, ptr0, len0, visible);
    }
    show_all() {
        wasm.viewer_show_all(this.__wbg_ptr);
    }
    /**
     * Viewer handles of every loaded `IfcSpace` element.
     * @returns {Uint32Array}
     */
    space_handles() {
        const ret = wasm.viewer_space_handles(this.__wbg_ptr);
        return ret;
    }
    /**
     * Viewer statistics as a JSON string. `drawCalls`/`visibleTriangles`
     * are the last encoded frame (post frustum cull); `batches` is the
     * unculled total.
     * @returns {string}
     */
    stats() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.viewer_stats(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {number} amount
     * @returns {boolean}
     */
    step_view_animation(amount) {
        const ret = wasm.viewer_step_view_animation(this.__wbg_ptr, amount);
        return ret !== 0;
    }
    /**
     * Re-frame the model from an explicit model→eye direction.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    view_direction(x, y, z) {
        wasm.viewer_view_direction(this.__wbg_ptr, x, y, z);
    }
    /**
     * Current view animation target axes as JSON, or the current camera axes
     * when no animation is running.
     * @returns {string}
     */
    view_target_camera_axes() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.viewer_view_target_camera_axes(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * `delta` in wheel notches, positive = zoom out, toward `(x, y)`.
     * @param {number} delta
     * @param {number} x
     * @param {number} y
     */
    zoom(delta, x, y) {
        wasm.viewer_zoom(this.__wbg_ptr, delta, x, y);
    }
    /**
     * `zoom` whose step scale comes from the rendered surface under `(x, y)` (physical px), resolved by
     * the pick pass: only the element actually under the cursor sets the distance, not a nearer element
     * whose AABB the cursor ray happens to cross. Resolves to `true` once the camera has moved. Callers
     * should coalesce wheel events while a call is pending.
     * @param {number} delta
     * @param {number} x
     * @param {number} y
     * @returns {Promise<any>}
     */
    zoom_pick(delta, x, y) {
        const ret = wasm.viewer_zoom_pick(this.__wbg_ptr, delta, x, y);
        return ret;
    }
}
if (Symbol.dispose) Viewer.prototype[Symbol.dispose] = Viewer.prototype.free;

export function start() {
    wasm.start();
}

/**
 * The document API's JSON wire over the loaded documents: request JSON in, response JSON out (never
 * throws). Document ids are `"s<sourceId>"`; the current document is the last one loaded.
 * @param {string} request
 * @returns {string}
 */
export function worker_call(request) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(request, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.worker_call(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Drop every retained model without starting a load. Used when a JT load
 * (handled by the separate JT wasm module) replaces the scene: the packed
 * buffers are new, so keeping the old semantic models would only pin heap.
 */
export function worker_clear_models() {
    wasm.worker_clear_models();
}

/**
 * Feed the next slice of a source file that is being reopened as an editable document.
 * @param {Uint8Array} chunk
 */
export function worker_edit_chunk(chunk) {
    const ptr0 = passArray8ToWasm0(chunk, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.worker_edit_chunk(ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Open the fed bytes as the editable twin of viewer source `source_id` and return its document id
 * (`"edit<sourceId>"`). The viewer's own document is pruned to metadata and read-only; entity ids match.
 * @param {number} source_id
 * @returns {string}
 */
export function worker_edit_finish(source_id) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ret = wasm.worker_edit_finish(source_id);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * `{"type", "globalId", "name"}` of any IfcRoot entity, JSON.
 * @param {number} source_id
 * @param {number} entity_id
 * @returns {string | undefined}
 */
export function worker_element_info(source_id, entity_id) {
    const ret = wasm.worker_element_info(source_id, entity_id);
    let v1;
    if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
}

/**
 * Feed the next slice of the current source file (same sniffing as the load
 * path, so `.ifczip` sources work too).
 * @param {Uint8Array} chunk
 */
export function worker_export_chunk(chunk) {
    const ptr0 = passArray8ToWasm0(chunk, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.worker_export_chunk(ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Finish the current source file; `selection` holds the entity ids of the
 * selected elements in this file (empty = whole file).
 * @param {Uint32Array} selection
 */
export function worker_export_file_done(selection) {
    const ptr0 = passArray32ToWasm0(selection, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.worker_export_file_done(ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Drop any accumulated export state and start over.
 */
export function worker_export_reset() {
    wasm.worker_export_reset();
}

/**
 * Run the export over the accumulated documents (byte-identical to the CLI's split and merge). Returns
 * `{ data: Uint8Array, warnings: string[], entities: number }`.
 * @returns {any}
 */
export function worker_export_run() {
    const ret = wasm.worker_export_run();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * IFC coordinate-operation georeference for one retained model, JSON.
 * @param {number} source_id
 * @returns {string | undefined}
 */
export function worker_georeference(source_id) {
    const ret = wasm.worker_georeference(source_id);
    let v1;
    if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
}

/**
 * Whole-buffer load: begin + one chunk + finish (kept for callers that
 * already hold the full file, e.g. small drops and tests).
 * @param {Uint8Array} data
 * @param {Function} on_progress
 * @param {Function} on_snapshot
 * @param {number} circle_segments
 * @param {boolean} render_sharp_edges
 * @param {boolean} clear_existing
 * @param {string} orphaned_elements_mode
 * @returns {any}
 */
export function worker_load(data, on_progress, on_snapshot, circle_segments, render_sharp_edges, clear_existing, orphaned_elements_mode) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(orphaned_elements_mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.worker_load(ptr0, len0, on_progress, on_snapshot, circle_segments, render_sharp_edges, clear_existing, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Start a chunked load, dropping any previous ingest state.
 * @param {number} circle_segments
 * @param {boolean} render_sharp_edges
 * @param {boolean} clear_existing
 * @param {string} orphaned_elements_mode
 */
export function worker_load_begin(circle_segments, render_sharp_edges, clear_existing, orphaned_elements_mode) {
    const ptr0 = passStringToWasm0(orphaned_elements_mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.worker_load_begin(circle_segments, render_sharp_edges, clear_existing, ptr0, len0);
}

/**
 * Feed the next slice of the input file. Fails fast on header problems
 * (missing HEADER/DATA, unsupported schema) so the main thread can stop
 * pumping early.
 * @param {Uint8Array} chunk
 */
export function worker_load_chunk(chunk) {
    const ptr0 = passArray8ToWasm0(chunk, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.worker_load_chunk(ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Finish the chunked load: complete the parse, tessellate, pack. Blocks the
 * worker; `on_progress(phase, done, total)` fires throttled (phases:
 * "parse", "geom", "pack") and `on_snapshot(Uint8Array)` with a packed
 * preview of the elements finished so far. Returns
 * `{ packed: Uint8Array, tree: string|undefined, heapMB: number }`.
 * @param {Function} on_progress
 * @param {Function} on_snapshot
 * @returns {any}
 */
export function worker_load_finish(on_progress, on_snapshot) {
    const ret = wasm.worker_load_finish(on_progress, on_snapshot);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Lazily decode property sets belonging to one element (or spatial node).
 * @param {number} source_id
 * @param {number} entity_id
 * @returns {string | undefined}
 */
export function worker_properties(source_id, entity_id) {
    const ret = wasm.worker_properties(source_id, entity_id);
    let v1;
    if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
}

/**
 * Compute dark structural edge lines after the model is visible.
 * @returns {any}
 */
export function worker_sharp_edges() {
    const ret = wasm.worker_sharp_edges();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Bytes produced by the last `worker_call` (`document.save` without a path, packs), once.
 * @returns {Uint8Array | undefined}
 */
export function worker_take_bytes() {
    const ret = wasm.worker_take_bytes();
    return ret;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Window_a07901001eb4269f: function(arg0) {
            const ret = arg0.Window;
            return ret;
        },
        __wbg_WorkerGlobalScope_d1b9459d53a39f3d: function(arg0) {
            const ret = arg0.WorkerGlobalScope;
            return ret;
        },
        __wbg___wbindgen_debug_string_c25d447a39f5578f: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_1ff95bcc5517c252: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_ea9085d691f535d3: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_undefined_c05833b95a3cf397: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_throw_344f42d3211c4765: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_fffb441def202758: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_beginRenderPass_10e1d8bb36f2f74e: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.beginRenderPass(arg1);
            return ret;
        }, arguments); },
        __wbg_call_44b7209e1e252e6a: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            const ret = arg0.call(arg1, arg2, arg3, arg4);
            return ret;
        }, arguments); },
        __wbg_call_a6e5c5dce5018821: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_configure_3d64c677c7d68a15: function() { return handleError(function (arg0, arg1) {
            arg0.configure(arg1);
        }, arguments); },
        __wbg_copyBufferToBuffer_8bb974c7f9c5f4dc: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbg_copyBufferToBuffer_8fe240a0000c9e22: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4, arg5);
        }, arguments); },
        __wbg_copyTextureToBuffer_4186c16aef1922a5: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.copyTextureToBuffer(arg1, arg2, arg3);
        }, arguments); },
        __wbg_createBindGroupLayout_9ea1a44942aaf13e: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createBindGroupLayout(arg1);
            return ret;
        }, arguments); },
        __wbg_createBindGroup_2320df4db188406c: function(arg0, arg1) {
            const ret = arg0.createBindGroup(arg1);
            return ret;
        },
        __wbg_createBuffer_2f08c0205e04efca: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createBuffer(arg1);
            return ret;
        }, arguments); },
        __wbg_createCommandEncoder_cd88faca35d9ed68: function(arg0, arg1) {
            const ret = arg0.createCommandEncoder(arg1);
            return ret;
        },
        __wbg_createPipelineLayout_7a186f2e9bf0d605: function(arg0, arg1) {
            const ret = arg0.createPipelineLayout(arg1);
            return ret;
        },
        __wbg_createRenderPipeline_f48187ba9f7701e8: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createRenderPipeline(arg1);
            return ret;
        }, arguments); },
        __wbg_createShaderModule_53701de4fb271c90: function(arg0, arg1) {
            const ret = arg0.createShaderModule(arg1);
            return ret;
        },
        __wbg_createTexture_9e76b80a2dc0d12e: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createTexture(arg1);
            return ret;
        }, arguments); },
        __wbg_createView_cc96b5bdd3d5bf5e: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createView(arg1);
            return ret;
        }, arguments); },
        __wbg_debug_87fd9b1a625b7efb: function(arg0) {
            console.debug(arg0);
        },
        __wbg_description_18d0a6d4077fec8e: function(arg0, arg1) {
            const ret = arg1.description;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_document_179650d6cb13c263: function(arg0) {
            const ret = arg0.document;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_drawIndexed_68637ebab6dd8d6e: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
        },
        __wbg_draw_ad0811de56a2d768: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        },
        __wbg_end_414453a89205612c: function(arg0) {
            arg0.end();
        },
        __wbg_error_287b079609b734b7: function(arg0) {
            const ret = arg0.error;
            return ret;
        },
        __wbg_error_744744ff0c9861e6: function(arg0) {
            console.error(arg0);
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_finish_087cb89c65c06eb1: function(arg0) {
            const ret = arg0.finish();
            return ret;
        },
        __wbg_finish_cfaeede3baf55be1: function(arg0, arg1) {
            const ret = arg0.finish(arg1);
            return ret;
        },
        __wbg_getContext_e79ddf6a9cb3cc76: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getContext_fd298c901058eb31: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getCurrentTexture_51975ae7185fd15f: function() { return handleError(function (arg0) {
            const ret = arg0.getCurrentTexture();
            return ret;
        }, arguments); },
        __wbg_getMappedRange_5ed22727c9679168: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getMappedRange(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_getPreferredCanvasFormat_1b8495aeb1d11ab1: function(arg0) {
            const ret = arg0.getPreferredCanvasFormat();
            return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
        },
        __wbg_get_b2053e9bfdf3ca8e: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_gpu_a7c12045c25d009a: function(arg0) {
            const ret = arg0.gpu;
            return ret;
        },
        __wbg_height_6eec812c213259a1: function(arg0) {
            const ret = arg0.height;
            return ret;
        },
        __wbg_info_22dcf1fd1b12bc7d: function(arg0) {
            const ret = arg0.info;
            return ret;
        },
        __wbg_info_eadbe775a8e2e9eb: function(arg0) {
            console.info(arg0);
        },
        __wbg_instanceof_GpuAdapter_fc7b89fc546de0bc: function(arg0) {
            let result;
            try {
                result = arg0 instanceof GPUAdapter;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuCanvasContext_1a39fd0621603553: function(arg0) {
            let result;
            try {
                result = arg0 instanceof GPUCanvasContext;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuOutOfMemoryError_5ac5c50ce9ee21d2: function(arg0) {
            let result;
            try {
                result = arg0 instanceof GPUOutOfMemoryError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuValidationError_77b97d666afabac1: function(arg0) {
            let result;
            try {
                result = arg0 instanceof GPUValidationError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_05ba1ee4f6781663: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_label_47480289cc2bce71: function(arg0, arg1) {
            const ret = arg1.label;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_length_0133fa10e3234c57: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_1f0964f4a5e2c6d8: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_381d540857ec99e8: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_98f10d1e2f4ea968: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_limits_50a8c5e629dbfe40: function(arg0) {
            const ret = arg0.limits;
            return ret;
        },
        __wbg_log_d267660666346fb3: function(arg0) {
            console.log(arg0);
        },
        __wbg_mapAsync_bb0029907dd91181: function(arg0, arg1, arg2, arg3) {
            const ret = arg0.mapAsync(arg1 >>> 0, arg2, arg3);
            return ret;
        },
        __wbg_maxBindGroups_14611ac9ed1c6b56: function(arg0) {
            const ret = arg0.maxBindGroups;
            return ret;
        },
        __wbg_maxBindingsPerBindGroup_dd3f66044d2a9bfb: function(arg0) {
            const ret = arg0.maxBindingsPerBindGroup;
            return ret;
        },
        __wbg_maxBufferSize_f7ce3e1856349d2f: function(arg0) {
            const ret = arg0.maxBufferSize;
            return ret;
        },
        __wbg_maxColorAttachmentBytesPerSample_55e64194645ea041: function(arg0) {
            const ret = arg0.maxColorAttachmentBytesPerSample;
            return ret;
        },
        __wbg_maxColorAttachments_fd9187f9f786da18: function(arg0) {
            const ret = arg0.maxColorAttachments;
            return ret;
        },
        __wbg_maxComputeInvocationsPerWorkgroup_9b3b1fc261129782: function(arg0) {
            const ret = arg0.maxComputeInvocationsPerWorkgroup;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeX_c55bbbcc02b75241: function(arg0) {
            const ret = arg0.maxComputeWorkgroupSizeX;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeY_96f40b1ec3102a3a: function(arg0) {
            const ret = arg0.maxComputeWorkgroupSizeY;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeZ_c2b1061d521561bb: function(arg0) {
            const ret = arg0.maxComputeWorkgroupSizeZ;
            return ret;
        },
        __wbg_maxComputeWorkgroupStorageSize_fac26e89d99e08f9: function(arg0) {
            const ret = arg0.maxComputeWorkgroupStorageSize;
            return ret;
        },
        __wbg_maxComputeWorkgroupsPerDimension_cd001f910e9b4d70: function(arg0) {
            const ret = arg0.maxComputeWorkgroupsPerDimension;
            return ret;
        },
        __wbg_maxDynamicStorageBuffersPerPipelineLayout_29399b82af020d86: function(arg0) {
            const ret = arg0.maxDynamicStorageBuffersPerPipelineLayout;
            return ret;
        },
        __wbg_maxDynamicUniformBuffersPerPipelineLayout_6d6cf80f3bd08e52: function(arg0) {
            const ret = arg0.maxDynamicUniformBuffersPerPipelineLayout;
            return ret;
        },
        __wbg_maxInterStageShaderVariables_8b000f47a166b1d5: function(arg0) {
            const ret = arg0.maxInterStageShaderVariables;
            return ret;
        },
        __wbg_maxSampledTexturesPerShaderStage_618a49f33217dde2: function(arg0) {
            const ret = arg0.maxSampledTexturesPerShaderStage;
            return ret;
        },
        __wbg_maxSamplersPerShaderStage_aa09fa0311712a1a: function(arg0) {
            const ret = arg0.maxSamplersPerShaderStage;
            return ret;
        },
        __wbg_maxStorageBufferBindingSize_0ec83ae10ad73180: function(arg0) {
            const ret = arg0.maxStorageBufferBindingSize;
            return ret;
        },
        __wbg_maxStorageBuffersPerShaderStage_0cca5b468fcf10b6: function(arg0) {
            const ret = arg0.maxStorageBuffersPerShaderStage;
            return ret;
        },
        __wbg_maxStorageTexturesPerShaderStage_9d6c35770f37866c: function(arg0) {
            const ret = arg0.maxStorageTexturesPerShaderStage;
            return ret;
        },
        __wbg_maxTextureArrayLayers_c2bf9c85285832d4: function(arg0) {
            const ret = arg0.maxTextureArrayLayers;
            return ret;
        },
        __wbg_maxTextureDimension1D_e09f86e22ea6bac9: function(arg0) {
            const ret = arg0.maxTextureDimension1D;
            return ret;
        },
        __wbg_maxTextureDimension2D_2631916ef9a3efa8: function(arg0) {
            const ret = arg0.maxTextureDimension2D;
            return ret;
        },
        __wbg_maxTextureDimension3D_06ee54121b37d431: function(arg0) {
            const ret = arg0.maxTextureDimension3D;
            return ret;
        },
        __wbg_maxUniformBufferBindingSize_af9e8a077907ed64: function(arg0) {
            const ret = arg0.maxUniformBufferBindingSize;
            return ret;
        },
        __wbg_maxUniformBuffersPerShaderStage_f871b70865df8c11: function(arg0) {
            const ret = arg0.maxUniformBuffersPerShaderStage;
            return ret;
        },
        __wbg_maxVertexAttributes_e72dabb2714f5cf5: function(arg0) {
            const ret = arg0.maxVertexAttributes;
            return ret;
        },
        __wbg_maxVertexBufferArrayStride_6a1cd814386082ce: function(arg0) {
            const ret = arg0.maxVertexBufferArrayStride;
            return ret;
        },
        __wbg_maxVertexBuffers_9c61c5fd286ebcc6: function(arg0) {
            const ret = arg0.maxVertexBuffers;
            return ret;
        },
        __wbg_message_6769962f0009c864: function(arg0, arg1) {
            const ret = arg1.message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_minStorageBufferOffsetAlignment_e214f59628fb3558: function(arg0) {
            const ret = arg0.minStorageBufferOffsetAlignment;
            return ret;
        },
        __wbg_minUniformBufferOffsetAlignment_58b69e1c3924f6a4: function(arg0) {
            const ret = arg0.minUniformBufferOffsetAlignment;
            return ret;
        },
        __wbg_navigator_51379c10a84aeec9: function(arg0) {
            const ret = arg0.navigator;
            return ret;
        },
        __wbg_navigator_99621db14b3f1099: function(arg0) {
            const ret = arg0.navigator;
            return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_32b398fb48b6d94a: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_aec3e25493d729fe: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___js_sys_b717609f51f566e8___Function_fn_wasm_bindgen_e5b56900f987f3b9___JsValue_____wasm_bindgen_e5b56900f987f3b9___sys__Undefined___js_sys_b717609f51f566e8___Function_fn_wasm_bindgen_e5b56900f987f3b9___JsValue_____wasm_bindgen_e5b56900f987f3b9___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_da52cf8fe3429cb2: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_from_slice_7568ba55b4a7e81f: function(arg0, arg1) {
            const ret = new Uint32Array(getArrayU32FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_from_slice_ddf8b82c4d6af38e: function(arg0, arg1) {
            const ret = new Float32Array(getArrayF32FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_typed_1824d93f294193e5: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___js_sys_b717609f51f566e8___Function_fn_wasm_bindgen_e5b56900f987f3b9___JsValue_____wasm_bindgen_e5b56900f987f3b9___sys__Undefined___js_sys_b717609f51f566e8___Function_fn_wasm_bindgen_e5b56900f987f3b9___JsValue_____wasm_bindgen_e5b56900f987f3b9___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_with_byte_offset_and_length_54c7724ee3ec7d82: function(arg0, arg1, arg2) {
            const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_new_with_length_112583d83d0cb73c: function(arg0) {
            const ret = new Float64Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_length_e1d8c8061ed4e317: function(arg0) {
            const ret = new Float32Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_length_e6785c33c8e4cce8: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_length_f048f86e32f1515e: function(arg0) {
            const ret = new Uint32Array(arg0 >>> 0);
            return ret;
        },
        __wbg_now_86c0d4ba3fa605b8: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_onSubmittedWorkDone_1460145eecea40ef: function(arg0) {
            const ret = arg0.onSubmittedWorkDone();
            return ret;
        },
        __wbg_prototypesetcall_21a175a0a8157491: function(arg0, arg1, arg2) {
            Float64Array.prototype.set.call(getArrayF64FromWasm0(arg0, arg1), arg2);
        },
        __wbg_prototypesetcall_4770620bbe4688a0: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_prototypesetcall_ba9c9a7197c11933: function(arg0, arg1, arg2) {
            Float32Array.prototype.set.call(getArrayF32FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_d2ae3af0c1217ae6: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_querySelectorAll_7e98cbe256deaadd: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_queueMicrotask_0ab5b2d2393e99b9: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_queueMicrotask_6a09b7bc46549209: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_queue_65d985f3e6d786a6: function(arg0) {
            const ret = arg0.queue;
            return ret;
        },
        __wbg_requestAdapter_9ff5c9d1ff271165: function(arg0, arg1) {
            const ret = arg0.requestAdapter(arg1);
            return ret;
        },
        __wbg_requestDevice_c1c34f88a477e509: function(arg0, arg1) {
            const ret = arg0.requestDevice(arg1);
            return ret;
        },
        __wbg_resolve_2191a4dfe481c25b: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_setBindGroup_4ba56e1e0d26f244: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
        }, arguments); },
        __wbg_setBindGroup_6124849cc8547086: function(arg0, arg1, arg2) {
            arg0.setBindGroup(arg1 >>> 0, arg2);
        },
        __wbg_setIndexBuffer_17431786d06c1b7c: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4);
        },
        __wbg_setPipeline_bab24dbce96903b9: function(arg0, arg1) {
            arg0.setPipeline(arg1);
        },
        __wbg_setScissorRect_40786fdec122b032: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.setScissorRect(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        },
        __wbg_setVertexBuffer_b508baf8d0ffe331: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4);
        },
        __wbg_set_1e016b6a1b5f7cb3: function(arg0, arg1, arg2) {
            arg0.set(getArrayF32FromWasm0(arg1, arg2));
        },
        __wbg_set_29967298e530d279: function(arg0, arg1, arg2) {
            arg0.set(getArrayF64FromWasm0(arg1, arg2));
        },
        __wbg_set_4d7dd76f3dae2926: function(arg0, arg1, arg2) {
            arg0.set(getArrayU8FromWasm0(arg1, arg2));
        },
        __wbg_set_61e45ae8061eca11: function(arg0, arg1, arg2) {
            arg0.set(arg1, arg2 >>> 0);
        },
        __wbg_set_8535240470bf2500: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_a_5f6e488475272136: function(arg0, arg1) {
            arg0.a = arg1;
        },
        __wbg_set_access_091f317905cd76a5: function(arg0, arg1) {
            arg0.access = __wbindgen_enum_GpuStorageTextureAccess[arg1];
        },
        __wbg_set_alpha_aa2e606e9e647b21: function(arg0, arg1) {
            arg0.alpha = arg1;
        },
        __wbg_set_alpha_mode_92402195b3ae1ee7: function(arg0, arg1) {
            arg0.alphaMode = __wbindgen_enum_GpuCanvasAlphaMode[arg1];
        },
        __wbg_set_alpha_to_coverage_enabled_b4ce9c3f7f8b7ad7: function(arg0, arg1) {
            arg0.alphaToCoverageEnabled = arg1 !== 0;
        },
        __wbg_set_array_layer_count_daec613068108a9d: function(arg0, arg1) {
            arg0.arrayLayerCount = arg1 >>> 0;
        },
        __wbg_set_array_stride_c2c009eabc18b5f6: function(arg0, arg1) {
            arg0.arrayStride = arg1;
        },
        __wbg_set_aspect_77332ac136ee94eb: function(arg0, arg1) {
            arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
        },
        __wbg_set_aspect_a823a14d00d42d37: function(arg0, arg1) {
            arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
        },
        __wbg_set_attributes_05f9117fd32ca606: function(arg0, arg1) {
            arg0.attributes = arg1;
        },
        __wbg_set_b5e6b338281ca6ff: function(arg0, arg1, arg2) {
            arg0.set(getArrayU32FromWasm0(arg1, arg2));
        },
        __wbg_set_b_688365d692bba214: function(arg0, arg1) {
            arg0.b = arg1;
        },
        __wbg_set_base_array_layer_cc6c68d233489c4b: function(arg0, arg1) {
            arg0.baseArrayLayer = arg1 >>> 0;
        },
        __wbg_set_base_mip_level_e07a3efe9006d5ea: function(arg0, arg1) {
            arg0.baseMipLevel = arg1 >>> 0;
        },
        __wbg_set_beginning_of_pass_write_index_27be5b0b35ec3de0: function(arg0, arg1) {
            arg0.beginningOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_bind_group_layouts_5325d038771af328: function(arg0, arg1) {
            arg0.bindGroupLayouts = arg1;
        },
        __wbg_set_binding_b6b0fe5c281b8c69: function(arg0, arg1) {
            arg0.binding = arg1 >>> 0;
        },
        __wbg_set_binding_f3c188a8cd21455b: function(arg0, arg1) {
            arg0.binding = arg1 >>> 0;
        },
        __wbg_set_blend_8d6e9c08b5702a09: function(arg0, arg1) {
            arg0.blend = arg1;
        },
        __wbg_set_buffer_55f096330c8912b4: function(arg0, arg1) {
            arg0.buffer = arg1;
        },
        __wbg_set_buffer_aa7bf4ad8f17b2bd: function(arg0, arg1) {
            arg0.buffer = arg1;
        },
        __wbg_set_buffer_e89095a9f0cafad3: function(arg0, arg1) {
            arg0.buffer = arg1;
        },
        __wbg_set_buffers_85a7238f4ef28ab4: function(arg0, arg1) {
            arg0.buffers = arg1;
        },
        __wbg_set_bytes_per_row_68a1ea90d4710bc9: function(arg0, arg1) {
            arg0.bytesPerRow = arg1 >>> 0;
        },
        __wbg_set_clear_value_642701f928a5ccb3: function(arg0, arg1) {
            arg0.clearValue = arg1;
        },
        __wbg_set_code_56e2d45ec1ff6c2d: function(arg0, arg1, arg2) {
            arg0.code = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_color_attachments_abe67f6631926e28: function(arg0, arg1) {
            arg0.colorAttachments = arg1;
        },
        __wbg_set_color_bc393d7efc3c8594: function(arg0, arg1) {
            arg0.color = arg1;
        },
        __wbg_set_compare_1509dc1a5420943f: function(arg0, arg1) {
            arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
        },
        __wbg_set_count_26a934d1cd07d080: function(arg0, arg1) {
            arg0.count = arg1 >>> 0;
        },
        __wbg_set_cull_mode_9d466c1ab414cac8: function(arg0, arg1) {
            arg0.cullMode = __wbindgen_enum_GpuCullMode[arg1];
        },
        __wbg_set_depth_bias_428c9340b0fd937b: function(arg0, arg1) {
            arg0.depthBias = arg1;
        },
        __wbg_set_depth_bias_clamp_f009599ca67fa30c: function(arg0, arg1) {
            arg0.depthBiasClamp = arg1;
        },
        __wbg_set_depth_bias_slope_scale_7125880b4cb7a951: function(arg0, arg1) {
            arg0.depthBiasSlopeScale = arg1;
        },
        __wbg_set_depth_clear_value_442bf492734f63b6: function(arg0, arg1) {
            arg0.depthClearValue = arg1;
        },
        __wbg_set_depth_compare_30e9ea552da12fe2: function(arg0, arg1) {
            arg0.depthCompare = __wbindgen_enum_GpuCompareFunction[arg1];
        },
        __wbg_set_depth_fail_op_5e42dc3e4c382951: function(arg0, arg1) {
            arg0.depthFailOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_depth_load_op_34d430b74bb36d91: function(arg0, arg1) {
            arg0.depthLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_depth_or_array_layers_4bbbeadacb393f02: function(arg0, arg1) {
            arg0.depthOrArrayLayers = arg1 >>> 0;
        },
        __wbg_set_depth_read_only_138a11b10c731094: function(arg0, arg1) {
            arg0.depthReadOnly = arg1 !== 0;
        },
        __wbg_set_depth_stencil_1bd50dbc450c8650: function(arg0, arg1) {
            arg0.depthStencil = arg1;
        },
        __wbg_set_depth_stencil_attachment_1ee0d93bc3273369: function(arg0, arg1) {
            arg0.depthStencilAttachment = arg1;
        },
        __wbg_set_depth_store_op_0ea0a215313dbda7: function(arg0, arg1) {
            arg0.depthStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_depth_write_enabled_64c2e7f6fa4b6b7b: function(arg0, arg1) {
            arg0.depthWriteEnabled = arg1 !== 0;
        },
        __wbg_set_device_0d774b66e7288f72: function(arg0, arg1) {
            arg0.device = arg1;
        },
        __wbg_set_dimension_174ad7e2fb67fb4e: function(arg0, arg1) {
            arg0.dimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_dimension_36e13ccecae5af4b: function(arg0, arg1) {
            arg0.dimension = __wbindgen_enum_GpuTextureDimension[arg1];
        },
        __wbg_set_dst_factor_1ed75271a89a711e: function(arg0, arg1) {
            arg0.dstFactor = __wbindgen_enum_GpuBlendFactor[arg1];
        },
        __wbg_set_end_of_pass_write_index_e8f52fc08bc0603e: function(arg0, arg1) {
            arg0.endOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_entries_3017e6132f938c6e: function(arg0, arg1) {
            arg0.entries = arg1;
        },
        __wbg_set_entries_fc76ca4d7da6a709: function(arg0, arg1) {
            arg0.entries = arg1;
        },
        __wbg_set_entry_point_6fec5723cc790927: function(arg0, arg1, arg2) {
            arg0.entryPoint = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_entry_point_8db3b6d103e3b865: function(arg0, arg1, arg2) {
            arg0.entryPoint = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_external_texture_825fe2bc7a0c0603: function(arg0, arg1) {
            arg0.externalTexture = arg1;
        },
        __wbg_set_fail_op_77ab26c98f847b65: function(arg0, arg1) {
            arg0.failOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_format_1786adb7bc74c7c9: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_6606f5c1fba6f459: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuVertexFormat[arg1];
        },
        __wbg_set_format_90860b0321868db4: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_abf7a1bc5425c56a: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_d347899cd860709c: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_e9d4b1475bb3bd3b: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_f9341112e43ea182: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_fragment_1a595620425637e1: function(arg0, arg1) {
            arg0.fragment = arg1;
        },
        __wbg_set_front_face_50cdf4eb61504a46: function(arg0, arg1) {
            arg0.frontFace = __wbindgen_enum_GpuFrontFace[arg1];
        },
        __wbg_set_g_d4d1d77cf8fdd362: function(arg0, arg1) {
            arg0.g = arg1;
        },
        __wbg_set_has_dynamic_offset_7d30014fdbfe90c5: function(arg0, arg1) {
            arg0.hasDynamicOffset = arg1 !== 0;
        },
        __wbg_set_height_7d9d8f892e6964c6: function(arg0, arg1) {
            arg0.height = arg1 >>> 0;
        },
        __wbg_set_height_bbeef8f354041577: function(arg0, arg1) {
            arg0.height = arg1 >>> 0;
        },
        __wbg_set_height_e8b5483b8c117d5e: function(arg0, arg1) {
            arg0.height = arg1 >>> 0;
        },
        __wbg_set_label_03d2396d4655a3e1: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_0c1bd0e976cf0a9a: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_1175a3329a06e52b: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_2d2227f4d5991e50: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_2f592bd1be3db6b3: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_8fd860a36d2c7b74: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_bae57fb9f24fde5c: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_be45aed56e4b9fee: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_c47c451211e2f6d2: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_cd567b7b35838e4c: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_d1c24b5a7a3ac31d: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_f92ae11c77d74198: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_layout_7c5ba5bdcde8a0f0: function(arg0, arg1) {
            arg0.layout = arg1;
        },
        __wbg_set_layout_eeef59714f5bf48b: function(arg0, arg1) {
            arg0.layout = arg1;
        },
        __wbg_set_load_op_56844f51434037bf: function(arg0, arg1) {
            arg0.loadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_mapped_at_creation_48de4735fab51e78: function(arg0, arg1) {
            arg0.mappedAtCreation = arg1 !== 0;
        },
        __wbg_set_mask_0c49a66362fc0079: function(arg0, arg1) {
            arg0.mask = arg1 >>> 0;
        },
        __wbg_set_min_binding_size_689661b9ed25e083: function(arg0, arg1) {
            arg0.minBindingSize = arg1;
        },
        __wbg_set_mip_level_246db61be15bdd69: function(arg0, arg1) {
            arg0.mipLevel = arg1 >>> 0;
        },
        __wbg_set_mip_level_count_72f8bc1f80f7539b: function(arg0, arg1) {
            arg0.mipLevelCount = arg1 >>> 0;
        },
        __wbg_set_mip_level_count_b19a0d9192e62d5d: function(arg0, arg1) {
            arg0.mipLevelCount = arg1 >>> 0;
        },
        __wbg_set_module_08ad08e736d8edbf: function(arg0, arg1) {
            arg0.module = arg1;
        },
        __wbg_set_module_14e471fdd94c582d: function(arg0, arg1) {
            arg0.module = arg1;
        },
        __wbg_set_multisample_85f073947b782d07: function(arg0, arg1) {
            arg0.multisample = arg1;
        },
        __wbg_set_multisampled_40505c1381e1c32c: function(arg0, arg1) {
            arg0.multisampled = arg1 !== 0;
        },
        __wbg_set_offset_2c374e604504e0b2: function(arg0, arg1) {
            arg0.offset = arg1;
        },
        __wbg_set_offset_73156b0e0b41d79a: function(arg0, arg1) {
            arg0.offset = arg1;
        },
        __wbg_set_offset_8d9d9afffa18b591: function(arg0, arg1) {
            arg0.offset = arg1;
        },
        __wbg_set_onuncapturederror_b9a9ff2c881b2b40: function(arg0, arg1) {
            arg0.onuncapturederror = arg1;
        },
        __wbg_set_operation_b5862f5a1a143b30: function(arg0, arg1) {
            arg0.operation = __wbindgen_enum_GpuBlendOperation[arg1];
        },
        __wbg_set_origin_9b3b0fbe0a5dc469: function(arg0, arg1) {
            arg0.origin = arg1;
        },
        __wbg_set_pass_op_e9470d1262fb8a8b: function(arg0, arg1) {
            arg0.passOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_power_preference_c0d3fa7ce46b1a2e: function(arg0, arg1) {
            arg0.powerPreference = __wbindgen_enum_GpuPowerPreference[arg1];
        },
        __wbg_set_primitive_369241acd17871f1: function(arg0, arg1) {
            arg0.primitive = arg1;
        },
        __wbg_set_query_set_18679a8580267d5a: function(arg0, arg1) {
            arg0.querySet = arg1;
        },
        __wbg_set_r_527e5a41c4b1a846: function(arg0, arg1) {
            arg0.r = arg1;
        },
        __wbg_set_required_features_54918de8185c5fab: function(arg0, arg1) {
            arg0.requiredFeatures = arg1;
        },
        __wbg_set_required_limits_3b031f66f838f4e3: function(arg0, arg1) {
            arg0.requiredLimits = arg1;
        },
        __wbg_set_resolve_target_fe76b3f99cf72078: function(arg0, arg1) {
            arg0.resolveTarget = arg1;
        },
        __wbg_set_resource_fe385d2e3dadaf63: function(arg0, arg1) {
            arg0.resource = arg1;
        },
        __wbg_set_rows_per_image_f9878f4b10f4fd7f: function(arg0, arg1) {
            arg0.rowsPerImage = arg1 >>> 0;
        },
        __wbg_set_sample_count_865e1d19b84e27e6: function(arg0, arg1) {
            arg0.sampleCount = arg1 >>> 0;
        },
        __wbg_set_sample_type_7088b1efddce6a69: function(arg0, arg1) {
            arg0.sampleType = __wbindgen_enum_GpuTextureSampleType[arg1];
        },
        __wbg_set_sampler_8c5d7fb1b02058c6: function(arg0, arg1) {
            arg0.sampler = arg1;
        },
        __wbg_set_shader_location_0ff30a733291a396: function(arg0, arg1) {
            arg0.shaderLocation = arg1 >>> 0;
        },
        __wbg_set_size_1e6281b07cd39177: function(arg0, arg1) {
            arg0.size = arg1;
        },
        __wbg_set_size_41cd9255ca1e4242: function(arg0, arg1) {
            arg0.size = arg1;
        },
        __wbg_set_size_a61ff22205255d61: function(arg0, arg1) {
            arg0.size = arg1;
        },
        __wbg_set_src_factor_1c4f755f8676df1b: function(arg0, arg1) {
            arg0.srcFactor = __wbindgen_enum_GpuBlendFactor[arg1];
        },
        __wbg_set_stencil_back_6ef4683123b19b25: function(arg0, arg1) {
            arg0.stencilBack = arg1;
        },
        __wbg_set_stencil_clear_value_10b58f674d0177c2: function(arg0, arg1) {
            arg0.stencilClearValue = arg1 >>> 0;
        },
        __wbg_set_stencil_front_aeb8580a97e5424b: function(arg0, arg1) {
            arg0.stencilFront = arg1;
        },
        __wbg_set_stencil_load_op_f20a90a66acd3d8c: function(arg0, arg1) {
            arg0.stencilLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_stencil_read_mask_2954f260d47349ea: function(arg0, arg1) {
            arg0.stencilReadMask = arg1 >>> 0;
        },
        __wbg_set_stencil_read_only_fb489d191b6d969b: function(arg0, arg1) {
            arg0.stencilReadOnly = arg1 !== 0;
        },
        __wbg_set_stencil_store_op_477c4cf6422dfa3f: function(arg0, arg1) {
            arg0.stencilStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_stencil_write_mask_3f8e9b3781814a95: function(arg0, arg1) {
            arg0.stencilWriteMask = arg1 >>> 0;
        },
        __wbg_set_step_mode_a35aef328761c452: function(arg0, arg1) {
            arg0.stepMode = __wbindgen_enum_GpuVertexStepMode[arg1];
        },
        __wbg_set_storage_texture_ab9eed9786337ef0: function(arg0, arg1) {
            arg0.storageTexture = arg1;
        },
        __wbg_set_store_op_caeede4654b3d847: function(arg0, arg1) {
            arg0.storeOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_strip_index_format_0cd0510e166c4ec4: function(arg0, arg1) {
            arg0.stripIndexFormat = __wbindgen_enum_GpuIndexFormat[arg1];
        },
        __wbg_set_targets_6b0b3bdd87f35668: function(arg0, arg1) {
            arg0.targets = arg1;
        },
        __wbg_set_texture_16d2be474ce6ad0c: function(arg0, arg1) {
            arg0.texture = arg1;
        },
        __wbg_set_texture_e25a73da75cf5808: function(arg0, arg1) {
            arg0.texture = arg1;
        },
        __wbg_set_timestamp_writes_c552d52fbb417005: function(arg0, arg1) {
            arg0.timestampWrites = arg1;
        },
        __wbg_set_topology_beefb3aca0612b00: function(arg0, arg1) {
            arg0.topology = __wbindgen_enum_GpuPrimitiveTopology[arg1];
        },
        __wbg_set_type_38961e08504ca674: function(arg0, arg1) {
            arg0.type = __wbindgen_enum_GpuBufferBindingType[arg1];
        },
        __wbg_set_type_c1eebc19f8a6aeb9: function(arg0, arg1) {
            arg0.type = __wbindgen_enum_GpuSamplerBindingType[arg1];
        },
        __wbg_set_unclipped_depth_5a4f7eb57fe006b2: function(arg0, arg1) {
            arg0.unclippedDepth = arg1 !== 0;
        },
        __wbg_set_usage_7f0dda8309469b1c: function(arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        },
        __wbg_set_usage_7fa9cd18d1104aca: function(arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        },
        __wbg_set_usage_908213a4d4bb8bde: function(arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        },
        __wbg_set_usage_ae014e77ff77ce06: function(arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        },
        __wbg_set_vertex_a4951dd9a7a4ed54: function(arg0, arg1) {
            arg0.vertex = arg1;
        },
        __wbg_set_view_bdeab150b5f0768c: function(arg0, arg1) {
            arg0.view = arg1;
        },
        __wbg_set_view_dbd0294573f64d05: function(arg0, arg1) {
            arg0.view = arg1;
        },
        __wbg_set_view_dimension_263387976511ebc9: function(arg0, arg1) {
            arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_view_dimension_3ed01b237e85826f: function(arg0, arg1) {
            arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_view_formats_bab284fc81b40e70: function(arg0, arg1) {
            arg0.viewFormats = arg1;
        },
        __wbg_set_view_formats_fe531a043efb71fa: function(arg0, arg1) {
            arg0.viewFormats = arg1;
        },
        __wbg_set_visibility_1bca121a89accba5: function(arg0, arg1) {
            arg0.visibility = arg1 >>> 0;
        },
        __wbg_set_width_1a5e2e86fa5bdcd8: function(arg0, arg1) {
            arg0.width = arg1 >>> 0;
        },
        __wbg_set_width_49ac9b7d914afc85: function(arg0, arg1) {
            arg0.width = arg1 >>> 0;
        },
        __wbg_set_width_8e30d010cd66830d: function(arg0, arg1) {
            arg0.width = arg1 >>> 0;
        },
        __wbg_set_write_mask_144b25e2bd909124: function(arg0, arg1) {
            arg0.writeMask = arg1 >>> 0;
        },
        __wbg_set_x_56f0c2c08a62725c: function(arg0, arg1) {
            arg0.x = arg1 >>> 0;
        },
        __wbg_set_y_04fb8ce84735b4e1: function(arg0, arg1) {
            arg0.y = arg1 >>> 0;
        },
        __wbg_set_z_a51316db27a4941e: function(arg0, arg1) {
            arg0.z = arg1 >>> 0;
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_4ef717fb391d88b7: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_8d1badc68b5a74f4: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_146583524fe1469b: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f2829a2234d7819e: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_3ed232c8a6baee09: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_submit_1290d44bb76ecef4: function(arg0, arg1) {
            arg0.submit(arg1);
        },
        __wbg_then_16d107c451e9905d: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_then_4a0b9283a66c4a8a: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_then_6ec10ae38b3e92f7: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_unmap_8f06698a75b8331a: function(arg0) {
            arg0.unmap();
        },
        __wbg_valueOf_64f89f12f08671ee: function(arg0) {
            const ret = arg0.valueOf();
            return ret;
        },
        __wbg_viewer_new: function(arg0) {
            const ret = Viewer.__wrap(arg0);
            return ret;
        },
        __wbg_warn_b1370d804fa3e259: function(arg0) {
            console.warn(arg0);
        },
        __wbg_width_6d9315ecc7140ff6: function(arg0) {
            const ret = arg0.width;
            return ret;
        },
        __wbg_writeBuffer_b4bdd36178348ca5: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5, arg6);
        }, arguments); },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 241, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue______true_);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 280, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_e5b56900f987f3b9___JsError___true_);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUUncapturedErrorEvent")], shim_idx: 241, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue______true__2);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000005: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000006: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./viewer_wasm_bg.js": import0,
    };
}

function wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue______true_(arg0, arg1, arg2) {
    wasm.wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue______true_(arg0, arg1, arg2);
}

function wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue______true__2(arg0, arg1, arg2) {
    wasm.wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue______true__2(arg0, arg1, arg2);
}

function wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_e5b56900f987f3b9___JsError___true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___wasm_bindgen_e5b56900f987f3b9___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_e5b56900f987f3b9___JsError___true_(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___js_sys_b717609f51f566e8___Function_fn_wasm_bindgen_e5b56900f987f3b9___JsValue_____wasm_bindgen_e5b56900f987f3b9___sys__Undefined___js_sys_b717609f51f566e8___Function_fn_wasm_bindgen_e5b56900f987f3b9___JsValue_____wasm_bindgen_e5b56900f987f3b9___sys__Undefined_______true_(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen_e5b56900f987f3b9___convert__closures_____invoke___js_sys_b717609f51f566e8___Function_fn_wasm_bindgen_e5b56900f987f3b9___JsValue_____wasm_bindgen_e5b56900f987f3b9___sys__Undefined___js_sys_b717609f51f566e8___Function_fn_wasm_bindgen_e5b56900f987f3b9___JsValue_____wasm_bindgen_e5b56900f987f3b9___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
}


const __wbindgen_enum_GpuBlendFactor = ["zero", "one", "src", "one-minus-src", "src-alpha", "one-minus-src-alpha", "dst", "one-minus-dst", "dst-alpha", "one-minus-dst-alpha", "src-alpha-saturated", "constant", "one-minus-constant", "src1", "one-minus-src1", "src1-alpha", "one-minus-src1-alpha"];


const __wbindgen_enum_GpuBlendOperation = ["add", "subtract", "reverse-subtract", "min", "max"];


const __wbindgen_enum_GpuBufferBindingType = ["uniform", "storage", "read-only-storage"];


const __wbindgen_enum_GpuCanvasAlphaMode = ["opaque", "premultiplied"];


const __wbindgen_enum_GpuCompareFunction = ["never", "less", "equal", "less-equal", "greater", "not-equal", "greater-equal", "always"];


const __wbindgen_enum_GpuCullMode = ["none", "front", "back"];


const __wbindgen_enum_GpuFrontFace = ["ccw", "cw"];


const __wbindgen_enum_GpuIndexFormat = ["uint16", "uint32"];


const __wbindgen_enum_GpuLoadOp = ["load", "clear"];


const __wbindgen_enum_GpuPowerPreference = ["low-power", "high-performance"];


const __wbindgen_enum_GpuPrimitiveTopology = ["point-list", "line-list", "line-strip", "triangle-list", "triangle-strip"];


const __wbindgen_enum_GpuSamplerBindingType = ["filtering", "non-filtering", "comparison"];


const __wbindgen_enum_GpuStencilOperation = ["keep", "zero", "replace", "invert", "increment-clamp", "decrement-clamp", "increment-wrap", "decrement-wrap"];


const __wbindgen_enum_GpuStorageTextureAccess = ["write-only", "read-only", "read-write"];


const __wbindgen_enum_GpuStoreOp = ["store", "discard"];


const __wbindgen_enum_GpuTextureAspect = ["all", "stencil-only", "depth-only"];


const __wbindgen_enum_GpuTextureDimension = ["1d", "2d", "3d"];


const __wbindgen_enum_GpuTextureFormat = ["r8unorm", "r8snorm", "r8uint", "r8sint", "r16uint", "r16sint", "r16float", "rg8unorm", "rg8snorm", "rg8uint", "rg8sint", "r32uint", "r32sint", "r32float", "rg16uint", "rg16sint", "rg16float", "rgba8unorm", "rgba8unorm-srgb", "rgba8snorm", "rgba8uint", "rgba8sint", "bgra8unorm", "bgra8unorm-srgb", "rgb9e5ufloat", "rgb10a2uint", "rgb10a2unorm", "rg11b10ufloat", "rg32uint", "rg32sint", "rg32float", "rgba16uint", "rgba16sint", "rgba16float", "rgba32uint", "rgba32sint", "rgba32float", "stencil8", "depth16unorm", "depth24plus", "depth24plus-stencil8", "depth32float", "depth32float-stencil8", "bc1-rgba-unorm", "bc1-rgba-unorm-srgb", "bc2-rgba-unorm", "bc2-rgba-unorm-srgb", "bc3-rgba-unorm", "bc3-rgba-unorm-srgb", "bc4-r-unorm", "bc4-r-snorm", "bc5-rg-unorm", "bc5-rg-snorm", "bc6h-rgb-ufloat", "bc6h-rgb-float", "bc7-rgba-unorm", "bc7-rgba-unorm-srgb", "etc2-rgb8unorm", "etc2-rgb8unorm-srgb", "etc2-rgb8a1unorm", "etc2-rgb8a1unorm-srgb", "etc2-rgba8unorm", "etc2-rgba8unorm-srgb", "eac-r11unorm", "eac-r11snorm", "eac-rg11unorm", "eac-rg11snorm", "astc-4x4-unorm", "astc-4x4-unorm-srgb", "astc-5x4-unorm", "astc-5x4-unorm-srgb", "astc-5x5-unorm", "astc-5x5-unorm-srgb", "astc-6x5-unorm", "astc-6x5-unorm-srgb", "astc-6x6-unorm", "astc-6x6-unorm-srgb", "astc-8x5-unorm", "astc-8x5-unorm-srgb", "astc-8x6-unorm", "astc-8x6-unorm-srgb", "astc-8x8-unorm", "astc-8x8-unorm-srgb", "astc-10x5-unorm", "astc-10x5-unorm-srgb", "astc-10x6-unorm", "astc-10x6-unorm-srgb", "astc-10x8-unorm", "astc-10x8-unorm-srgb", "astc-10x10-unorm", "astc-10x10-unorm-srgb", "astc-12x10-unorm", "astc-12x10-unorm-srgb", "astc-12x12-unorm", "astc-12x12-unorm-srgb"];


const __wbindgen_enum_GpuTextureSampleType = ["float", "unfilterable-float", "depth", "sint", "uint"];


const __wbindgen_enum_GpuTextureViewDimension = ["1d", "2d", "2d-array", "cube", "cube-array", "3d"];


const __wbindgen_enum_GpuVertexFormat = ["uint8", "uint8x2", "uint8x4", "sint8", "sint8x2", "sint8x4", "unorm8", "unorm8x2", "unorm8x4", "snorm8", "snorm8x2", "snorm8x4", "uint16", "uint16x2", "uint16x4", "sint16", "sint16x2", "sint16x4", "unorm16", "unorm16x2", "unorm16x4", "snorm16", "snorm16x2", "snorm16x4", "float16", "float16x2", "float16x4", "float32", "float32x2", "float32x3", "float32x4", "uint32", "uint32x2", "uint32x3", "uint32x4", "sint32", "sint32x2", "sint32x3", "sint32x4", "unorm10-10-10-2", "unorm8x4-bgra"];


const __wbindgen_enum_GpuVertexStepMode = ["vertex", "instance"];
const ViewerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_viewer_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('viewer_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };

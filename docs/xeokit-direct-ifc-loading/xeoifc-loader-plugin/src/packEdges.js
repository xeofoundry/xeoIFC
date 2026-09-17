// Edge indices for every mesh of a packed scene buffer ("IFCP" version 1, see XeoIFCLoaderPlugin.js for the layout).
//
// xeokit generates edge indices itself when a mesh comes without them, on the main thread and slowly (string-keyed
// welding): on a 670 k instance model that was 30 of 45 seconds of scene build. This runs in the worker instead, on
// typed-array hash tables.
//
// An edge is drawn when it has one face only (boundary), more than two, or two faces meeting at more than
// EDGE_THRESHOLD_DEGREES - the threshold of the xeoIFC viewer, which keeps the facets of tessellated curves clean.

const EDGE_THRESHOLD_DEGREES = 30;
const COS_THRESHOLD = Math.cos(EDGE_THRESHOLD_DEGREES * Math.PI / 180);

const HEADER_WORDS = 112 / 4;
const SPAN_WORDS = 36 / 4;
const INSTANCE_WORDS = 96 / 4;
const ELEMENT_WORDS = 32 / 4;

const ONE_FACE = 1;
const SMOOTH = 2;
const DRAWN = 3;

function tableSize(entries) {
    let size = 16;
    while (size < entries * 2) {
        size *= 2;
    }
    return size;
}

/**
 * @param {ArrayBuffer} packed The packed scene.
 * @returns {{indices: Uint32Array, offsets: Uint32Array}} Mesh-local vertex index pairs; the edges of mesh m are
 * indices[offsets[m] .. offsets[m + 1]].
 */
export function buildPackEdges(packed) {

    const u32 = new Uint32Array(packed);
    const f32 = new Float32Array(packed);
    const [meshCount, instanceCount, elementCount, vertexFloats] = u32.subarray(10, 14);
    const spansAt = HEADER_WORDS;
    const verticesAt = spansAt + meshCount * SPAN_WORDS + instanceCount * INSTANCE_WORDS + elementCount * ELEMENT_WORDS;
    const indicesAt = verticesAt + vertexFloats;

    const offsets = new Uint32Array(meshCount + 1);
    let out = new Uint32Array(1 << 20);
    let outLength = 0;

    // Scratch, grown to the largest mesh
    let weld = new Int32Array(0); // vertex -> first vertex at the same position
    let vertexTable = new Int32Array(0);
    let normals = new Float32Array(0);
    let edgeLo = new Int32Array(0); // Hash table of undirected welded edges
    let edgeHi = new Int32Array(0);
    let edgeA = new Int32Array(0); // The edge in original vertex indices
    let edgeB = new Int32Array(0);
    let edgeFace = new Int32Array(0);
    let edgeState = new Uint8Array(0);

    for (let mesh = 0; mesh < meshCount; mesh++) {

        offsets[mesh] = outLength;

        const span = spansAt + mesh * SPAN_WORDS;
        const baseVertex = u32[span];
        const numVertices = (mesh + 1 < meshCount ? u32[span + SPAN_WORDS] : vertexFloats / 6) - baseVertex;
        const firstIndex = indicesAt + u32[span + 1];
        const numTriangles = u32[span + 2] / 3;
        const vertexAt = verticesAt + baseVertex * 6;

        // Weld by position: the pack splits vertices wherever normals differ

        const vertexMask = tableSize(numVertices) - 1;
        if (weld.length < numVertices) {
            weld = new Int32Array(numVertices);
        }
        if (vertexTable.length <= vertexMask) {
            vertexTable = new Int32Array(vertexMask + 1);
        }
        vertexTable.fill(-1, 0, vertexMask + 1);
        for (let v = 0; v < numVertices; v++) {
            const at = vertexAt + v * 6;
            const x = f32[at], y = f32[at + 1], z = f32[at + 2];
            // "+ 0" folds -0 into 0 so that equal positions hash alike
            let slot = (Math.imul((x + 0) * 1e4 | 0, 73856093) ^ Math.imul((y + 0) * 1e4 | 0, 19349663) ^ Math.imul((z + 0) * 1e4 | 0, 83492791)) & vertexMask;
            for (; ;) {
                const other = vertexTable[slot];
                if (other < 0) {
                    vertexTable[slot] = v;
                    weld[v] = v;
                    break;
                }
                const otherAt = vertexAt + other * 6;
                if (f32[otherAt] === x && f32[otherAt + 1] === y && f32[otherAt + 2] === z) {
                    weld[v] = other;
                    break;
                }
                slot = (slot + 1) & vertexMask;
            }
        }

        // Face normals and the edge table

        const edgeMask = tableSize(numTriangles * 3) - 1;
        if (normals.length < numTriangles * 3) {
            normals = new Float32Array(numTriangles * 3);
        }
        if (edgeLo.length <= edgeMask) {
            edgeLo = new Int32Array(edgeMask + 1);
            edgeHi = new Int32Array(edgeMask + 1);
            edgeA = new Int32Array(edgeMask + 1);
            edgeB = new Int32Array(edgeMask + 1);
            edgeFace = new Int32Array(edgeMask + 1);
            edgeState = new Uint8Array(edgeMask + 1);
        }
        edgeLo.fill(-1, 0, edgeMask + 1);

        for (let t = 0; t < numTriangles; t++) {
            const ia = u32[firstIndex + t * 3], ib = u32[firstIndex + t * 3 + 1], ic = u32[firstIndex + t * 3 + 2];
            const a = vertexAt + ia * 6, b = vertexAt + ib * 6, c = vertexAt + ic * 6;
            const ux = f32[b] - f32[a], uy = f32[b + 1] - f32[a + 1], uz = f32[b + 2] - f32[a + 2];
            const vx = f32[c] - f32[a], vy = f32[c + 1] - f32[a + 1], vz = f32[c + 2] - f32[a + 2];
            const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (length === 0) {
                continue; // Degenerate triangle: no direction, no edges
            }
            normals[t * 3] = nx / length;
            normals[t * 3 + 1] = ny / length;
            normals[t * 3 + 2] = nz / length;

            for (let e = 0; e < 3; e++) {
                const from = e === 0 ? ia : e === 1 ? ib : ic;
                const to = e === 0 ? ib : e === 1 ? ic : ia;
                const wFrom = weld[from], wTo = weld[to];
                if (wFrom === wTo) {
                    continue;
                }
                const lo = wFrom < wTo ? wFrom : wTo;
                const hi = wFrom < wTo ? wTo : wFrom;
                let slot = (Math.imul(lo, 73856093) ^ Math.imul(hi, 19349663)) & edgeMask;
                for (; ;) {
                    if (edgeLo[slot] < 0) {
                        edgeLo[slot] = lo;
                        edgeHi[slot] = hi;
                        edgeA[slot] = from;
                        edgeB[slot] = to;
                        edgeFace[slot] = t;
                        edgeState[slot] = ONE_FACE;
                        break;
                    }
                    if (edgeLo[slot] === lo && edgeHi[slot] === hi) {
                        if (edgeState[slot] === ONE_FACE) {
                            const f = edgeFace[slot] * 3;
                            const dot = normals[f] * normals[t * 3] + normals[f + 1] * normals[t * 3 + 1] + normals[f + 2] * normals[t * 3 + 2];
                            edgeState[slot] = dot < COS_THRESHOLD ? DRAWN : SMOOTH;
                        } else {
                            edgeState[slot] = DRAWN; // A third face: non-manifold
                        }
                        break;
                    }
                    slot = (slot + 1) & edgeMask;
                }
            }
        }

        for (let slot = 0; slot <= edgeMask; slot++) {
            if (edgeLo[slot] >= 0 && edgeState[slot] !== SMOOTH) {
                if (outLength + 2 > out.length) {
                    const grown = new Uint32Array(out.length * 2);
                    grown.set(out);
                    out = grown;
                }
                out[outLength++] = edgeA[slot];
                out[outLength++] = edgeB[slot];
            }
        }
    }

    offsets[meshCount] = outLength;
    return {indices: out.slice(0, outLength), offsets};
}

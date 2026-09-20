// xeoIFC showcase: a furnished villa with pool, garden and terrain, modelled from ONE picture (villa.jpg).
// Run:  xeoifc run villa.js --root .        (writes villa.ifc next to the script)
// Metres. x = east, y = north (the pool lies south of the house), z = up. Ground floor = 0, pool deck = -0.85.

// ------------------------------------------------------------------------------------------------ colours (r, g, b [, alpha])
const WHITE = [0.96, 0.95, 0.92], STONE = [0.76, 0.68, 0.55], TILE = [0.27, 0.28, 0.3], BLACK = [0.1, 0.1, 0.11];
const GLASS = [0.62, 0.78, 0.85, 0.3], SOLAR = [0.1, 0.16, 0.3, 0.75], PAVING = [0.9, 0.84, 0.74], GRAVEL = [0.8, 0.78, 0.73];
const WOOD = [0.62, 0.44, 0.27], FABRIC = [0.93, 0.9, 0.84], CUSHION = [0.98, 0.97, 0.94], LINEN = [0.85, 0.78, 0.68];
const GRASS = [0.36, 0.55, 0.2], LEAF = [0.22, 0.42, 0.16], CYPRESS = [0.13, 0.3, 0.13], LAVENDER = [0.55, 0.45, 0.7];
const BLOSSOM = [0.95, 0.95, 0.9], POT = [0.8, 0.62, 0.42], WATER = [0.2, 0.68, 0.86, 0.8], FLOOR = [0.88, 0.84, 0.78];
const STEEL = [0.75, 0.76, 0.78], WARM = [1.0, 0.85, 0.55], OAK = [0.75, 0.6, 0.42];

// ------------------------------------------------------------------------------------------------ document
const Z1 = 3.3, Z2 = 6.5, H = 2.9;   // first floor, roof, clear wall height
const doc = await xeo.document.create({
  schema: 'IFC4', units: { length: 'm' }, project: { name: 'Villa from a picture' },
  scaffold: { site: 'Garden', building: 'Villa', storeys: [
    { name: 'Ground floor', elevation: 0 }, { name: 'First floor', elevation: Z1 }, { name: 'Roof', elevation: Z2 }] },
});
const SITE = doc.site, [S0, S1, S2] = doc.storeys;

// ------------------------------------------------------------------------------------------------ geometry helpers
const box = (x0, y0, z0, x1, y1, z1) => ({ kind: 'box', origin: [x0, y0, z0], size: [x1 - x0, y1 - y0, z1 - z0] });
const cyl = (cx, cy, z0, radius, height) => ({ kind: 'extrusion', profile: { kind: 'circle', radius, center: [cx, cy] }, height, origin: [0, 0, z0] });
const r3 = (v) => Math.round(v * 1000) / 1000;

// Meshes: a box (optionally tilted about the x axis at a pivot), a lathe (profile = [radius, z] pairs) and a merge.
function boxMesh(x0, y0, z0, x1, y1, z1, tilt = 0, py = y0, pz = z0) {
  const c = Math.cos(tilt), s = Math.sin(tilt), positions = [];
  for (const [x, y, z] of [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])
    positions.push([r3(x), r3(py + (y - py) * c - (z - pz) * s), r3(pz + (y - py) * s + (z - pz) * c)]);
  return { kind: 'mesh', positions, indices: [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7] };
}
function lathe(profile, sides = 10, cx = 0, cy = 0) {
  const positions = [], indices = [], n = profile.length;
  for (const [radius, z] of profile)
    for (let j = 0; j < sides; j++) positions.push([r3(cx + radius * Math.cos(2 * Math.PI * j / sides)), r3(cy + radius * Math.sin(2 * Math.PI * j / sides)), r3(z)]);
  for (let i = 0; i + 1 < n; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j, b = i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
      indices.push(a, b, d, a, d, c);
    }
  positions.push([cx, cy, profile[0][1]], [cx, cy, profile[n - 1][1]]);
  for (let j = 0; j < sides; j++)
    indices.push(n * sides, (j + 1) % sides, j, n * sides + 1, (n - 1) * sides + j, (n - 1) * sides + (j + 1) % sides);
  return { kind: 'mesh', positions, indices };
}
function merge(...meshes) {
  const positions = [], indices = [];
  for (const m of meshes) { const o = positions.length; positions.push(...m.positions); indices.push(...m.indices.map((i) => i + o)); }
  return { kind: 'mesh', positions, indices };
}

// One element from several coloured parts: element.add creates it with the first part, geometry.add appends the others.
const styles = new Map();
async function styleOf(color) {
  const key = color.join(' ');
  if (!styles.has(key)) styles.set(key, (await xeo.style.add({ name: 'colour ' + key,
    rendering: { surfaceColour: color.slice(0, 3), transparency: 1 - (color[3] ?? 1) } })).ref);
  return styles.get(key);
}
async function make(type, name, container, at, parts, more = {}) {
  const element = await xeo.element.add({ type, name, container, location: at, geometry: parts[0][0], color: parts[0][1], ...more });
  for (const [item, color] of parts.slice(1)) await xeo.geometry.add({ target: element.ref, item, style: await styleOf(color) });
  return element;
}
const solid = (type, name, container, item, color, more = {}) => make(type, name, container, [0, 0, 0], [[item, color]], more);
const slab = (name, container, outline, z, thickness, color, predefinedType = 'FLOOR') => xeo.element.add({
  type: 'IfcSlab', name, container, color, predefinedType, location: [0, 0, z], geometry: { kind: 'slab', outline, thickness } });
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const wall = (name, container, start, end, color = WHITE, height = H, thickness = 0.3, z = 0, external = true) => xeo.element.add({
  type: 'IfcWall', name, container, color, location: [0, 0, z], geometry: { kind: 'wall', start, end, height, thickness },
  psets: { Pset_WallCommon: { IsExternal: external } } });

// A glazed front between two points of an axis-parallel line: black frames (IfcMember) and glass leaves (IfcWindow / IfcDoor).
async function glazing(name, container, a, b, panels, height = H, door = false) {
  const alongX = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]), length = alongX ? b[0] - a[0] : b[1] - a[1];
  const span = (s0, s1, half, z0, z1) => alongX ? box(a[0] + s0, a[1] - half, z0, a[0] + s1, a[1] + half, z1)
                                                 : box(a[0] - half, a[1] + s0, z0, a[0] + half, a[1] + s1, z1);
  const frame = [[span(0, length, 0.05, height - 0.07, height), BLACK], [span(0, length, 0.05, 0, 0.04), BLACK]];
  for (let i = 0; i <= panels; i++) { const s = length * i / panels; frame.push([span(s - 0.035, s + 0.035, 0.05, 0.04, height - 0.07), BLACK]); }
  await make('IfcMember', name + ' frame', container, [0, 0, 0], frame, { predefinedType: 'MULLION' });
  for (let i = 0; i < panels; i++)
    await solid(door ? 'IfcDoor' : 'IfcWindow', name + ' leaf ' + (i + 1), container,
      span(length * i / panels + 0.035, length * (i + 1) / panels - 0.035, 0.012, 0.04, height - 0.07), GLASS);
}
const balustrade = (name, container, item) => solid('IfcRailing', name, container, item, GLASS, { predefinedType: 'BALUSTRADE' });

// ------------------------------------------------------------------------------------------------ furniture library
// Local coordinates: the piece stands on z = 0 with its front towards -y; `at` = position, `rot` = degrees about z.
const put = (type, name, container, at, rot, parts, more = {}) => make(type, name, container, at, parts, { rotation: rot, ...more });
function sofaParts(w, frame, fabric, d = 0.95) {
  const parts = [[box(0, 0, 0.12, w, d, 0.4), fabric], [box(0.03, 0.03, 0, w - 0.03, d - 0.03, 0.12), frame],
    [box(0, d - 0.22, 0.4, w, d, 0.82), fabric], [box(0, 0, 0.4, 0.18, d - 0.22, 0.62), fabric], [box(w - 0.18, 0, 0.4, w, d - 0.22, 0.62), fabric]];
  const n = Math.max(1, Math.round((w - 0.36) / 0.75)), cw = (w - 0.36) / n;
  for (let i = 0; i < n; i++) {
    parts.push([box(0.19 + i * cw, 0.02, 0.4, 0.17 + (i + 1) * cw, d - 0.24, 0.54), CUSHION]);
    parts.push([box(0.22 + i * cw, d - 0.36, 0.54, 0.14 + (i + 1) * cw, d - 0.22, 0.9), CUSHION]);
  }
  return parts;
}
const sofa = (name, c, at, rot, w, frame = LINEN, fabric = FABRIC) => put('IfcFurniture', name, c, at, rot, sofaParts(w, frame, fabric), { predefinedType: 'SOFA' });
function tableParts(w, d, h, top, legs, leg = 0.07) {
  const parts = [[box(0, 0, h - 0.05, w, d, h), top]];
  for (const [x, y] of [[0.06, 0.06], [w - 0.06 - leg, 0.06], [0.06, d - 0.06 - leg], [w - 0.06 - leg, d - 0.06 - leg]]) parts.push([box(x, y, 0, x + leg, y + leg, h - 0.05), legs]);
  return parts;
}
const table = (name, c, at, rot, w, d, h, top = OAK, legs = OAK) => put('IfcFurniture', name, c, at, rot, tableParts(w, d, h, top, legs), { predefinedType: 'TABLE' });
const chair = (name, c, at, rot, frame = OAK, seat = FABRIC) => put('IfcFurniture', name, c, at, rot, [
  [box(0, 0, 0.4, 0.46, 0.46, 0.46), seat], [box(0, 0.42, 0.46, 0.46, 0.46, 0.9), frame],
  ...[[0, 0], [0.42, 0], [0, 0.42], [0.42, 0.42]].map(([x, y]) => [box(x, y, 0, x + 0.04, y + 0.04, 0.4), frame])], { predefinedType: 'CHAIR' });
const bed = (name, c, at, rot, w = 1.8, l = 2.1) => put('IfcFurniture', name, c, at, rot, [
  [box(0, 0, 0.28, w, l, 0.52), CUSHION], [box(-0.04, -0.04, 0, w + 0.04, l, 0.28), OAK], [box(-0.04, l, 0, w + 0.04, l + 0.08, 1.1), LINEN],
  [box(0, 0, 0.52, w, l * 0.6, 0.56), LINEN], [box(0.12, l - 0.55, 0.52, w / 2 - 0.06, l - 0.12, 0.66), WHITE],
  [box(w / 2 + 0.06, l - 0.55, 0.52, w - 0.12, l - 0.12, 0.66), WHITE]], { predefinedType: 'BED' });
const cabinet = (name, c, at, rot, w, d, h, body = OAK, top = null) => put('IfcFurniture', name, c, at, rot,
  top ? [[box(0, 0, 0, w, d, h - 0.04), body], [box(-0.02, -0.02, h - 0.04, w + 0.02, d + 0.02, h), top]] : [[box(0, 0, 0, w, d, h), body]]);
const rug = (name, c, x0, y0, x1, y1, color = LINEN) => solid('IfcFurnishingElement', name, c, box(x0, y0, 0, x1, y1, 0.02), color);
const curtain = (name, c, x0, y0, x1, y1) => solid('IfcFurnishingElement', name, c, box(x0, y0, 0.03, x1, y1, H - 0.1), WHITE, { objectType: 'Curtain' });
// Sun lounger (all meshes, so the back rest can be tilted): head towards +y.
const lounger = (name, c, at, rot) => put('IfcFurniture', name, c, at, rot, [
  [merge(boxMesh(0, 0, 0.22, 0.72, 2.0, 0.28), ...[[0.03, 0.05], [0.63, 0.05], [0.03, 1.85], [0.63, 1.85]].map(([x, y]) => boxMesh(x, y, 0, x + 0.06, y + 0.08, 0.22))), WOOD],
  [merge(boxMesh(0.03, 0.03, 0.28, 0.69, 1.3, 0.4), boxMesh(0.03, 1.3, 0.28, 0.69, 2.0, 0.4, 0.55, 1.3, 0.28)), CUSHION]], { objectType: 'Sun lounger' });
// Planter: a lathe-turned pot with a plant (crown = ellipsoid on a stem); h = overall plant height above the pot.
function crown(cx, cy, z, radius, height, sides = 8) {
  const profile = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6; profile.push([Math.max(0.02, radius * Math.sin(Math.PI * t)), z + height * (1 - Math.cos(Math.PI * t)) / 2]); }
  return lathe(profile, sides, cx, cy);
}
const planter = (name, c, at, potR = 0.32, potH = 0.6, h = 1.4, leaf = LEAF) => make('IfcFurnishingElement', name, c, at, [
  [lathe([[potR * 0.6, 0], [potR, potH * 0.55], [potR * 0.85, potH], [potR * 0.7, potH - 0.04]], 12), POT],
  [merge(crown(0, 0, potH + h * 0.35, h * 0.38, h * 0.65), crown(0.15, 0.1, potH + h * 0.2, h * 0.25, h * 0.4)), leaf],
  [lathe([[0.035, potH - 0.05], [0.03, potH + h * 0.5]], 6), WOOD]], { objectType: 'Planter' });
const shrub = (name, at, radius, color = LEAF) => make('IfcGeographicElement', name, SITE, at,
  [[merge(crown(0, 0, -0.05, radius, radius * 1.5), crown(radius * 0.7, radius * 0.3, -0.05, radius * 0.7, radius)), color]], { predefinedType: 'USERDEFINED', objectType: 'VEGETATION' });
const cypress = (name, at, h) => make('IfcGeographicElement', name, SITE, at, [
  [lathe([[0.25, 0.5], [0.62, h * 0.22], [0.66, h * 0.45], [0.45, h * 0.75], [0.2, h * 0.93], [0.03, h]], 9), CYPRESS],
  [lathe([[0.12, -0.3], [0.1, 0.6]], 6), WOOD]], { predefinedType: 'USERDEFINED', objectType: 'VEGETATION' });

// ------------------------------------------------------------------------------------------------ terrain
// A 1 m grid over the plot. Cells under the house, the paving and the pool are left out; the lawn steps down from the
// house platform (-0.05) to the pool level (-0.9) and rises gently towards the back wall.
const PLOT = { x0: -20, y0: -24, x1: 32, y1: 20 };
const COVERED = [[-10, -7, 14, 0], [14, -3, 22, 0], [0, 0, 21, 9], [17, -1, 21, 0], [-7, 1, 0, 8], [4, -10, 9, -7], [-2, -20, 16, -10], [22, -3, 24, -1]];
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function ground(x, y) {
  const shift = 5 * Math.min(1, Math.max(0, (-4 - x) / 4));   // the upper lawn reaches further south on the west side
  const south = smooth(-7 - shift, -9.5 - shift, y), east = smooth(22, 24.5, x) * (1 - smooth(6, 11, y));
  return -0.05 - 0.85 * Math.max(south, east) + 0.03 * Math.max(0, y - 12) + 0.03 * Math.sin(0.31 * x) * Math.cos(0.27 * y);
}
{
  const nx = PLOT.x1 - PLOT.x0, ny = PLOT.y1 - PLOT.y0, positions = [], indices = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) positions.push([PLOT.x0 + i, PLOT.y0 + j, r3(ground(PLOT.x0 + i, PLOT.y0 + j))]);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const cx = PLOT.x0 + i + 0.5, cy = PLOT.y0 + j + 0.5;
    if (COVERED.some(([x0, y0, x1, y1]) => cx > x0 && cx < x1 && cy > y0 && cy < y1)) continue;
    const a = j * (nx + 1) + i;
    indices.push(a, a + 1, a + nx + 2, a, a + nx + 2, a + nx + 1);
  }
  await solid('IfcGeographicElement', 'Lawn terrain', SITE, { kind: 'mesh', positions, indices }, GRASS, { predefinedType: 'TERRAIN' });
}

// ------------------------------------------------------------------------------------------------ paving, steps, pool
await slab('Terrace paving', SITE, [[-10, -7], [14, -7], [14, -3], [22, -3], [22, 0], [-10, 0]], -0.15, 0.15, PAVING);
const stepsDown = [];
for (let i = 1; i < 5; i++) stepsDown.push(boxMesh(4, -7 - 0.3 * i, -1, 9, -7 - 0.3 * (i - 1), -0.17 * i));
await solid('IfcStairFlight', 'Garden steps', SITE, merge(...stepsDown), PAVING);
const stepsEast = [];
for (let i = 1; i < 5; i++) stepsEast.push(boxMesh(22 + 0.3 * (i - 1), -3, -1, 22 + 0.3 * i, -1, -0.17 * i));
await solid('IfcStairFlight', 'Side steps', SITE, merge(...stepsEast, boxMesh(23.2, -3, -1, 24, -1, -0.85)), PAVING);
const POOL = [0, -18, 12, -12], DECK = [-2, -20, 16, -10], zd = -0.85;
await slab('Pool deck west', SITE, rect(DECK[0], DECK[1], POOL[0], DECK[3]), zd - 0.15, 0.15, PAVING);
await slab('Pool deck east', SITE, rect(POOL[2], DECK[1], DECK[2], DECK[3]), zd - 0.15, 0.15, PAVING);
await slab('Pool deck south', SITE, rect(POOL[0], DECK[1], POOL[2], POOL[1]), zd - 0.15, 0.15, PAVING);
await slab('Pool deck north', SITE, rect(POOL[0], POOL[3], POOL[2], DECK[3]), zd - 0.15, 0.15, PAVING);
await slab('Deck link to the steps', SITE, rect(4, -10, 9, -8.2), zd - 0.15, 0.15, PAVING);
await make('IfcBuildingElementProxy', 'Pool basin', SITE, [0, 0, 0], [
  [box(POOL[0] - 0.25, POOL[1] - 0.25, zd - 1.75, POOL[2] + 0.25, POOL[3] + 0.25, zd - 1.5), WHITE],
  [box(POOL[0] - 0.25, POOL[1] - 0.25, zd - 1.5, POOL[0], POOL[3] + 0.25, zd - 0.15), WHITE], [box(POOL[2], POOL[1] - 0.25, zd - 1.5, POOL[2] + 0.25, POOL[3] + 0.25, zd - 0.15), WHITE],
  [box(POOL[0], POOL[1] - 0.25, zd - 1.5, POOL[2], POOL[1], zd - 0.15), WHITE], [box(POOL[0], POOL[3], zd - 1.5, POOL[2], POOL[3] + 0.25, zd - 0.15), WHITE],
  ...[1, 2, 3].map((i) => [box(POOL[2] - 2.4, POOL[3] - 0.4 * i, zd - 1.5, POOL[2], POOL[3] - 0.4 * (i - 1), zd - 0.05 - 0.3 * i), WHITE])], { objectType: 'Swimming pool' });
await solid('IfcBuildingElementProxy', 'Pool water', SITE, box(POOL[0], POOL[1], zd - 1.5, POOL[2], POOL[3], zd - 0.1), WATER, { objectType: 'Water' });

// ------------------------------------------------------------------------------------------------ garden walls, gate, planting
const stoneWall = (name, x0, y0, x1, y1, z0, z1) => solid('IfcWall', name, SITE, box(x0, y0, z0, x1, y1, z1), STONE, { predefinedType: 'USERDEFINED', objectType: 'Garden wall' });
await stoneWall('Planter wall west of the steps', -4.5, -8.4, 4, -8, -1.1, -0.05);
await stoneWall('Planter wall return', -4.9, -13.5, -4.5, -8, -1.1, -0.2);
await stoneWall('Planter wall east of the steps', 9, -8.4, 14, -8, -1.1, -0.05);
await stoneWall('Lawn wall stub', -14, -13.4, -10, -13, -1.1, 0.1);
await stoneWall('Side steps cheek south', 22, -3.4, 25.5, -3, -1.1, 0.25);
await stoneWall('Side steps cheek north', 22, -1, 24.5, -0.6, -1.1, 0.1);
await stoneWall('Boundary wall north-west', PLOT.x0, PLOT.y1 - 0.4, 24, PLOT.y1, -0.4, 1.6);
await stoneWall('Boundary wall north-east', 27, PLOT.y1 - 0.4, PLOT.x1, PLOT.y1, -0.4, 1.6);
await stoneWall('Boundary wall east', PLOT.x1 - 0.4, 8, PLOT.x1, PLOT.y1, -0.6, 1.5);
await stoneWall('Boundary wall east, lower garden', PLOT.x1 - 0.4, PLOT.y0, PLOT.x1, 8, -1.3, 0.4);
await stoneWall('Boundary wall west', PLOT.x0, -10, PLOT.x0 + 0.4, PLOT.y1, -0.4, 1.4);
await make('IfcDoor', 'Garden gate', SITE, [0, 0, 0], [[box(24.05, PLOT.y1 - 0.25, 0.35, 26.95, PLOT.y1 - 0.17, 2.1), WOOD],
  [box(23.6, PLOT.y1 - 0.5, -0.4, 24.05, PLOT.y1 + 0.1, 2.3), STONE], [box(26.95, PLOT.y1 - 0.5, -0.4, 27.4, PLOT.y1 + 0.1, 2.3), STONE]], { predefinedType: 'GATE' });
await solid('IfcGeographicElement', 'Hedge north', SITE, box(PLOT.x0 + 0.5, PLOT.y1 - 1.5, 0, 23, PLOT.y1 - 0.5, 2.1), LEAF, { predefinedType: 'USERDEFINED', objectType: 'VEGETATION' });
await solid('IfcGeographicElement', 'Hedge east', SITE, box(PLOT.x1 - 1.5, 9, 0, PLOT.x1 - 0.5, PLOT.y1 - 0.5, 2.0), LEAF, { predefinedType: 'USERDEFINED', objectType: 'VEGETATION' });
const trees = [[-16, 4, 5.5], [-17, -21, 6.5], [-18, -12, 5], [3, 17, 5], [9, 17.5, 6], [13, 17, 5.5], [16, 16.5, 6.5], [19, 17, 5], [24.5, 8, 5.5],
  [27, 3, 6.5], [28.5, -2, 7], [29, -8, 7.5], [27, 12.5, 5], [29, 15.5, 6], [-5, 16.5, 4.5]];
for (const [i, [x, y, h]] of trees.entries()) await cypress('Cypress ' + (i + 1), [x, y, ground(x, y)], h);
const beds = [[-3.5, -7.6, 0.55, LEAF], [-2.2, -7.5, 0.45, LAVENDER], [-0.8, -7.6, 0.6, LEAF], [0.6, -7.5, 0.5, LAVENDER], [2, -7.6, 0.55, LEAF], [3.2, -7.5, 0.4, BLOSSOM],
  [9.8, -7.6, 0.5, LEAF], [11, -7.5, 0.45, BLOSSOM], [12.3, -7.6, 0.55, LAVENDER], [13.4, -7.5, 0.4, LEAF],
  [-6.5, -11, 0.55, LEAF], [-5.8, -12.3, 0.45, BLOSSOM], [-7.4, -12, 0.5, LAVENDER], [22.8, -4.2, 0.5, LEAF], [24, -4.4, 0.4, BLOSSOM], [23, 0.4, 0.5, LAVENDER],
  [21.8, -3.8, 0.45, BLOSSOM], [14.8, -3.6, 0.5, LEAF], [16, -3.7, 0.45, LAVENDER]];
for (const [i, [x, y, radius, color]] of beds.entries()) await shrub('Shrub ' + (i + 1), [x, y, ground(x, y)], radius, color);

// ------------------------------------------------------------------------------------------------ ground floor: shell
// Main block x 0..13, y 0..9; east wing x 13..21 (its roof is a terrace); end block x 17..21 projects 1 m; kitchen annex x -7..0, y 1..8.
await slab('Ground floor slab', S0, [[0, 0], [17, 0], [17, -1], [21, -1], [21, 9], [0, 9], [0, 8], [-7, 8], [-7, 1], [0, 1]], -0.25, 0.25, FLOOR, 'BASESLAB');
await solid('IfcColumn', 'Stone pier, living room', S0, box(0, -0.3, 0, 1.6, 0.45, H), STONE);
await glazing('Living room sliding doors', S0, [1.6, 0.15], [9, 0.15], 4, H, true);
await wall('Front wall between the rooms', S0, [9, 0.15], [10, 0.15]);
await glazing('Garden room doors', S0, [10, 0.15], [12.6, 0.15], 2, H, true);
await wall('Front wall, wing joint', S0, [12.6, 0.15], [13.4, 0.15]);
await glazing('Wing lounge doors', S0, [13.4, 0.15], [16.2, 0.15], 2, H, true);
await solid('IfcColumn', 'Stone pier, wing', S0, box(16.2, -0.3, 0, 17, 0.45, H + 0.4), STONE);
const tiled = (name, container, item) => solid('IfcCovering', name, container, item, TILE, { predefinedType: 'CLADDING' });
await wall('Guest bedroom front wall west', S0, [17, -0.85], [18.2, -0.85], TILE, 3.6);
await wall('Guest bedroom front wall east', S0, [20, -0.85], [21, -0.85], TILE, 3.6);
await tiled('Guest bedroom lintel cladding', S0, box(18.2, -1, H, 20, -0.7, 3.6));
await glazing('Guest bedroom doors', S0, [18.2, -0.85], [20, -0.85], 2, H, true);
await wall('Guest bedroom west cheek', S0, [17.15, -1], [17.15, 0], TILE, 3.6);
const east = await wall('East wall', S0, [20.85, -1], [20.85, 9], WHITE, 3.6);
await xeo.opening.add({ host: east.ref, offset: 5.5, width: 1.6, height: 1.4, sill: 0.9, fill: { type: 'IfcWindow', name: 'Guest bathroom window', color: GLASS } });
const north = await wall('North wall', S0, [21, 8.85], [0, 8.85]);
for (const [i, offset] of [2, 6.5, 11, 15.5].entries())
  await xeo.opening.add({ host: north.ref, offset, width: 1.8, height: 1.3, sill: 1.0, fill: { type: 'IfcWindow', name: 'North window ' + (i + 1), color: GLASS } });
await wall('West wall, upper part', S0, [0.15, 8], [0.15, 9]);
await wall('West wall, front part', S0, [0.15, 0.45], [0.15, 1]);
await wall('Annex north wall', S0, [0, 7.85], [-7, 7.85]);
const annexWest = await wall('Annex west wall', S0, [-6.85, 8], [-6.85, 1]);
await xeo.opening.add({ host: annexWest.ref, offset: 2.2, width: 2.6, height: 1.2, sill: 1.05, fill: { type: 'IfcWindow', name: 'Kitchen window', color: GLASS } });
await glazing('Kitchen glazing', S0, [-6.7, 1.15], [0, 1.15], 5, H, true);
const party = await wall('Wall living room / garden room', S0, [9.5, 0.3], [9.5, 6.2], WHITE, H, 0.15, 0, false);
await xeo.opening.add({ host: party.ref, offset: 3.2, width: 1.0, height: 2.2, fill: { type: 'IfcDoor', name: 'Door to the garden room', color: OAK } });
const guest = await wall('Wall wing lounge / guest bedroom', S0, [17, 0], [17, 8.7], WHITE, H, 0.15, 0, false);
await xeo.opening.add({ host: guest.ref, offset: 3.5, width: 0.9, height: 2.1, fill: { type: 'IfcDoor', name: 'Guest bedroom door', color: OAK } });
await wall('Guest bathroom wall', S0, [17, 5], [20.7, 5], WHITE, H, 0.12, 0, false);
const flight = [];
for (let i = 0; i < 19; i++) flight.push(boxMesh(7 + 0.28 * i, 7.7, Math.max(0, Z1 / 19 * (i - 1)), 7.28 + 0.28 * i, 8.7, Z1 / 19 * (i + 1)));
await solid('IfcStairFlight', 'Stair to the first floor', S0, merge(...flight), OAK);
await balustrade('Stair balustrade', S0, box(7, 7.66, 0, 12.3, 7.7, Z1 + 1));

// First-floor slab: balcony along the front, terrace over the wing, a notch for the stair. Roof slabs over annex and end block.
await slab('First floor slab with balcony', S0, [[0, -0.4], [17, -0.4], [17, 9], [12.4, 9], [12.4, 7.7], [7.3, 7.7], [7.3, 9], [0, 9]], H, Z1 - H, WHITE);
await slab('Guest block roof', S1, rect(17, -1, 21, 9), 3.6 - Z1, 0.3, WHITE, 'ROOF');
await slab('Annex roof', S0, rect(-7, 1, 0, 8), H, 0.35, WHITE, 'ROOF');
await solid('IfcCovering', 'Annex roof gravel', S0, box(-6.7, 1.3, H + 0.35, -0.1, 7.7, H + 0.4), GRAVEL, { predefinedType: 'ROOFING' });
for (const [name, item] of [['Annex parapet south', box(-7, 1, H + 0.35, 0, 1.3, H + 0.6)], ['Annex parapet west', box(-7, 1.3, H + 0.35, -6.7, 7.7, H + 0.6)],
  ['Annex parapet north', box(-7, 7.7, H + 0.35, 0, 8, H + 0.6)], ['Guest block parapet', box(17, -1, 3.9, 21, -0.7, 4.2)],
  ['Guest block parapet east', box(20.7, -0.7, 3.9, 21, 9, 4.2)], ['Guest block parapet north', box(17, 8.7, 3.9, 20.7, 9, 4.2)]])
  await solid('IfcWall', name, S0, item, WHITE, { predefinedType: 'PARAPET' });
await tiled('Guest block cladding towards the roof terrace', S0, box(17, 0, Z1, 17.3, 8.7, 3.9));
await solid('IfcWall', 'Guest block parapet west', S0, box(17, -0.7, 3.9, 17.3, 8.7, 4.2), WHITE, { predefinedType: 'PARAPET' });
await solid('IfcWall', 'Guest block north wall head', S0, box(17, 8.7, H, 21, 9, 3.6), WHITE);
await solid('IfcCovering', 'Guest block roof gravel', S0, box(17.3, -0.7, 3.9, 20.7, 8.7, 3.95), GRAVEL, { predefinedType: 'ROOFING' });

// ------------------------------------------------------------------------------------------------ pergola with a solar glass roof
{
  const parts = [];
  for (const x of [-9, -4.6, -0.2]) for (const y of [-5, 0.8]) parts.push([box(x, y, 0, x + 0.14, y + 0.14, 2.8), BLACK]);
  for (const y of [-5, 0.8]) parts.push([box(-9, y, 2.8, -0.06, y + 0.14, 3.02), BLACK]);
  for (let i = 0; i <= 6; i++) { const x = -9 + i * (8.8 / 6); parts.push([box(x, -5, 2.8, x + 0.1, 0.94, 3.02), BLACK]); }
  await make('IfcBuildingElementProxy', 'Pergola steel frame', S0, [0, 0, 0], parts, { objectType: 'Pergola' });
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
    const x = -9 + i * (8.8 / 6) + 0.12, y = -4.95 + j * 1.47;
    await solid('IfcPlate', 'Solar glass ' + (i + 1) + '.' + (j + 1), S0, box(x, y, 3.02, x + 8.8 / 6 - 0.14, y + 1.43, 3.05), SOLAR, { objectType: 'Photovoltaic glass' });
  }
}

// ------------------------------------------------------------------------------------------------ first floor: shell
// White frame x 0..13; the glazing is set back 2.4 m behind the balcony edge, the roof sails 1.4 m over the balcony.
await wall('First floor west wall', S1, [0.15, 1], [0.15, 9]);
await wall('First floor north wall', S1, [13, 8.85], [0, 8.85]);
const e1 = await wall('First floor east wall', S1, [12.85, 1], [12.85, 9]);
await xeo.opening.add({ host: e1.ref, offset: 2.2, width: 2.4, height: 2.3, fill: { type: 'IfcDoor', name: 'Door to the roof terrace', color: GLASS } });
await glazing('Master bedroom glazing', S1, [0.3, 2.4], [5.8, 2.4], 3, H, true);
await tiled('Tiled bay', S1, box(5.8, 1.5, 0, 9.2, 2.55, H));
await glazing('Studio glazing', S1, [9.2, 2.4], [12.7, 2.4], 2, H, true);
await wall('Wall master bedroom / hall', S1, [5.9, 2.5], [5.9, 7.6], WHITE, H, 0.12, 0, false);
await wall('Wall hall / studio', S1, [9.1, 2.5], [9.1, 7.6], WHITE, H, 0.12, 0, false);
await balustrade('Balcony balustrade', S1, box(0.05, -0.36, 0, 17, -0.34, 1.05));
await balustrade('Balcony balustrade west', S1, box(0.05, -0.34, 0, 0.07, 1, 1.05));
await balustrade('Roof terrace balustrade north', S1, box(13, 8.9, 0, 17, 8.92, 1.05));
await solid('IfcCovering', 'Roof terrace decking', S1, box(13, 0, 0, 17, 8.9, 0.03), GRAVEL, { predefinedType: 'FLOORING' });
await slab('Roof slab', S2, rect(0, 1, 13, 9), -0.3, 0.3, WHITE, 'ROOF');
await slab('Raised roof', S2, rect(6, 4, 13, 9), 0, 0.45, WHITE, 'ROOF');
for (const [name, item] of [['Roof parapet south', box(0, 1, 0, 13, 1.3, 0.4)], ['Roof parapet west', box(0, 1.3, 0, 0.3, 9, 0.4)],
  ['Roof parapet north', box(0.3, 8.7, 0, 6, 9, 0.4)], ['Roof parapet east', box(12.7, 1.3, 0, 13, 4, 0.4)]])
  await solid('IfcWall', name, S2, item, WHITE, { predefinedType: 'PARAPET' });
await solid('IfcCovering', 'Roof gravel', S2, box(0.3, 1.3, 0, 12.7, 4, 0.05), GRAVEL, { predefinedType: 'ROOFING' });
await solid('IfcCovering', 'Roof gravel west', S2, box(0.3, 4, 0, 6, 8.7, 0.05), GRAVEL, { predefinedType: 'ROOFING' });
await make('IfcUnitaryEquipment', 'Heat pump', S2, [3.6, 6.4, 0.05], [[box(0, 0, 0.1, 1.5, 0.75, 1.05), STEEL], [box(0.1, 0.1, 0, 1.4, 0.65, 0.1), BLACK],
  [cyl(0.45, 0.375, 1.05, 0.3, 0.03), BLACK], [cyl(1.08, 0.375, 1.05, 0.3, 0.03), BLACK]], { predefinedType: 'AIRCONDITIONINGUNIT' });
for (let i = 0; i < 4; i++)
  await solid('IfcSolarDevice', 'Solar panel ' + (i + 1), S2, boxMesh(6.6 + i * 1.12, 5.2, 0.55, 7.64 + i * 1.12, 7.2, 0.59, 0.26, 5.2, 0.55), SOLAR, { predefinedType: 'SOLARPANEL' });

// ------------------------------------------------------------------------------------------------ furniture: ground floor
await rug('Living room rug', S0, 2.2, 1.6, 7, 5.2);
await sofa('Living room sofa', S0, [2.8, 4.1, 0], 0, 3.2);
await sofa('Living room sofa, short side', S0, [6.3, 4.0, 0], -90, 2.2);
await sofa('Living room armchair', S0, [3.3, 2.5, 0], 90, 0.95);
await table('Coffee table', S0, [3.7, 2.5, 0], 0, 1.4, 0.8, 0.38);
await put('IfcFurniture', 'Sideboard with screen', S0, [1.2, 6.6, 0], 0, [[box(0, 0, 0, 3.6, 0.45, 0.45), OAK], [box(0.9, 0.18, 0.7, 2.7, 0.24, 1.7), BLACK]]);
await table('Dining table', S0, [11.8, 4.2, 0], 90, 2.0, 1.0, 0.76);
for (const [i, y] of [4.5, 5.4].entries()) { await chair('Dining chair ' + (2 * i + 1), S0, [10.7, y, 0], 90); await chair('Dining chair ' + (2 * i + 2), S0, [11.9, y + 0.46, 0], -90); }
await sofa('Garden room sofa', S0, [10.2, 1.2, 0], 0, 2.2);
await rug('Wing lounge rug', S0, 13.6, 1.2, 16.6, 4.4);
await sofa('Wing lounge sofa', S0, [13.8, 3.2, 0], 0, 2.6);
await sofa('Wing lounge armchair', S0, [15.9, 2.9, 0], -90, 0.95);
await table('Wing lounge table', S0, [14.5, 1.9, 0], 0, 1.1, 0.7, 0.36);
await bed('Guest bed', S0, [18.1, 1.2, 0], 0, 1.8);
await cabinet('Guest nightstand west', S0, [17.5, 2.9, 0], 0, 0.5, 0.4, 0.5);
await cabinet('Guest nightstand east', S0, [20, 2.9, 0], 0, 0.5, 0.4, 0.5);
await cabinet('Guest wardrobe', S0, [17.2, 4.3, 0], 0, 2.4, 0.6, 2.3, WHITE);
for (const [i, x] of [17.25, 20.2].entries()) await curtain('Guest bedroom curtain ' + (i + 1), S0, x, -0.62, x + 0.55, -0.54);
await cabinet('Kitchen counter', S0, [-6.6, 7.05, 0], 0, 6.4, 0.65, 0.92, TILE, WHITE);
await cabinet('Kitchen tall units', S0, [-6.6, 4.4, 0], 0, 0.65, 2.6, 2.3, OAK);
await cabinet('Kitchen island', S0, [-5, 4.3, 0], 0, 3.0, 1.1, 0.92, OAK, WHITE);
for (let i = 0; i < 4; i++) await put('IfcFurniture', 'Bar stool ' + (i + 1), S0, [-4.6 + i * 0.75, 3.85, 0], 0, [[cyl(0, 0, 0.62, 0.19, 0.06), LINEN], [cyl(0, 0, 0, 0.03, 0.62), BLACK], [cyl(0, 0, 0, 0.17, 0.02), BLACK]], { predefinedType: 'CHAIR' });
// Outdoor dining under the pergola, lounge on the terrace
await table('Outdoor dining table', S0, [-6.4, -2.6, 0], 0, 3.4, 1.1, 0.76, WOOD, WOOD);
for (let i = 0; i < 5; i++) { await chair('Outdoor chair south ' + (i + 1), S0, [-5.79 + i * 0.66, -2.75, 0], 180, WOOD, LINEN); await chair('Outdoor chair north ' + (i + 1), S0, [-6.25 + i * 0.66, -1.4, 0], 0, WOOD, LINEN); }
for (const [i, x] of [-5.6, -3.8].entries()) await make('IfcLightFixture', 'Pendant lamp ' + (i + 1), S0, [x, -2.05, 0], [
  [lathe([[0.3, 1.75], [0.27, 1.95], [0.12, 2.12], [0.03, 2.15]], 12), WARM], [boxMesh(-0.008, -0.008, 2.15, 0.008, 0.008, 2.8), BLACK]], { predefinedType: 'POINTSOURCE' });
await sofa('Terrace sofa', S0, [6.6, -2.4, 0], 0, 3.4, WOOD, FABRIC);
await sofa('Terrace sofa, short side', S0, [10.1, -2.5, 0], -90, 2.0, WOOD, FABRIC);
await table('Terrace coffee table', S0, [7.6, -4.2, 0], 0, 1.5, 0.8, 0.34, WOOD, WOOD);
const pots = [[-0.6, -1.0, 0.36, 0.7, 1.7], [0.9, -1.1, 0.36, 0.7, 1.9], [-1.6, -0.2, 0.3, 0.55, 1.2], [12.2, -1.2, 0.4, 0.75, 1.6], [11.2, -0.8, 0.28, 0.5, 1.0],
  [-8.2, 0.2, 0.34, 0.6, 1.5], [5.6, -1.0, 0.26, 0.45, 0.9]];
for (const [i, [x, y, radius, potH, h]] of pots.entries()) await planter('Terrace planter ' + (i + 1), S0, [x, y, 0], radius, potH, h);

// ------------------------------------------------------------------------------------------------ furniture: first floor, balcony, roof terrace
await bed('Master bed', S1, [2, 4.6, 0], 0, 2.0);
await cabinet('Master nightstand west', S1, [1.35, 6.3, 0], 0, 0.5, 0.4, 0.5);
await cabinet('Master nightstand east', S1, [4.15, 6.3, 0], 0, 0.5, 0.4, 0.5);
await rug('Master bedroom rug', S1, 1.2, 3.4, 4.9, 6);
await cabinet('Master wardrobe', S1, [0.4, 7.95, 0], 0, 5.2, 0.65, 2.5, WHITE);
await sofa('Bedroom bench', S1, [2.2, 3.3, 0], 0, 1.6);
for (const [i, x] of [0.4, 5.15].entries()) await curtain('Master bedroom curtain ' + (i + 1), S1, x, 2.55, x + 0.6, 2.63);
await sofa('Studio sofa', S1, [9.6, 5.2, 0], 0, 2.6);
await table('Studio table', S1, [10.2, 3.9, 0], 0, 1.2, 0.7, 0.36);
await put('IfcFurniture', 'Studio shelf', S1, [9.3, 6.9, 0], 0, [[box(0, 0, 0, 3.2, 0.4, 2.0), OAK]], { predefinedType: 'SHELF' });
await balustrade('Stair well balustrade', S1, box(7.3, 7.7, 0, 7.32, 8.7, 1.05));
for (const [i, x] of [9.3, 12.0].entries()) await curtain('Studio curtain ' + (i + 1), S1, x, 2.55, x + 0.6, 2.63);
for (const [i, [x, y, radius, potH, h]] of [[0.9, 0.5, 0.34, 0.65, 1.3], [2.6, 0.2, 0.3, 0.6, 1.6], [7.4, 0.4, 0.4, 0.75, 1.9], [4.4, 0.6, 0.26, 0.45, 0.9],
  [13.8, 7.6, 0.36, 0.7, 1.5], [15, 8, 0.3, 0.55, 1.1], [16.2, 7.7, 0.32, 0.6, 1.3]].entries()) await planter('Balcony planter ' + (i + 1), S1, [x, y, 0], radius, potH, h);
await lounger('Roof terrace lounger 1', S1, [13.8, 2.2, 0.03], -90);
await lounger('Roof terrace lounger 2', S1, [13.8, 3.6, 0.03], -90);
await table('Roof terrace side table', S1, [14.4, 4.0, 0.03], 0, 0.9, 0.6, 0.35, WOOD, WOOD);

// ------------------------------------------------------------------------------------------------ pool deck
for (let i = 0; i < 4; i++) {
  await lounger('Pool lounger ' + (i + 1), SITE, [13.2 + 0.25 * i, -12.4 - 1.75 * i, zd], -68);
  await put('IfcFurniture', 'Pool side table ' + (i + 1), SITE, [15.3 + 0.2 * i, -11.5 - 1.75 * i, zd], 0, [[cyl(0, 0, 0, 0.2, 0.38), WOOD]], { predefinedType: 'TABLE' });
}
await make('IfcFurniture', 'Parasol', SITE, [15.4, -18.6, zd], [[lathe([[1.7, 2.25], [0.9, 2.5], [0.04, 2.75]], 8), CUSHION],
  [boxMesh(-0.025, -0.025, 0, 0.025, 0.025, 2.75), WOOD], [lathe([[0.28, 0], [0.28, 0.08]], 12), STEEL]], { objectType: 'Parasol' });

// ------------------------------------------------------------------------------------------------ check and save
const check = await xeo.document.validate({ rules: ['schema', 'references', 'spatial', 'guid'] });
const count = await xeo.query.count({ text: 'is IfcProduct' });
console.log('products:', JSON.stringify(count), ' validation:', JSON.stringify(check.counts));
const saved = await xeo.document.save({ path: 'villa.ifc', overwrite: true });
console.log('saved', saved.path, '-', saved.entities, 'entities');

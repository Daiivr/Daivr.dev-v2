// Keep authored VRM 0 expressions, or only standard presets when requested.
// Run after optimize-vrm-images.mjs. The input file is never overwritten.
import { readFileSync, writeFileSync } from "node:fs";

const [input, output, mode, outfit] = process.argv.slice(2);
if (!input || !output || input === output) throw new Error("Usage: node scripts/prune-vrm-expressions.mjs input.vrm output.vrm");
const source = readFileSync(input);
const jsonLength = source.readUInt32LE(12);
const json = JSON.parse(source.subarray(20, 20 + jsonLength));
const binary = source.subarray(28 + jsonLength);
let groups = json.extensions?.VRM?.blendShapeMaster?.blendShapeGroups;
if (!groups || json.animations?.length) throw new Error("Expected VRM 0 without embedded animation tracks");
if (mode && !["--standard-presets", "--greeting-only"].includes(mode)) throw new Error("Unknown mode");
if (mode === "--standard-presets") {
  groups = groups.filter((group) => group.presetName && group.presetName !== "unknown");
  json.extensions.VRM.blendShapeMaster.blendShapeGroups = groups;
}
if (mode === "--greeting-only") {
  // The gate's VRMA contains only humanoid tracks; Kiyosa uses Joy throughout.
  groups = groups.filter((group) => ["neutral", "joy"].includes(group.presetName) || group.name === "Swimsuit&Ring");
  json.extensions.VRM.blendShapeMaster.blendShapeGroups = groups;
}

const discardedAccessors = new Set();
if (outfit && outfit !== "--without-long-sleeves") throw new Error("Unknown outfit option");
if (outfit === "--without-long-sleeves") {
  // Match the authored HideLongSleeves presets: reveal the rigged hands too.
  // Alternate prop-holding hands must remain hidden.
  for (const name of ["KiyosaBodyHandL", "KiyosaBodyHandR"]) {
    const material = json.materials.find((entry) => entry.name === name);
    const mtoon = json.extensions.VRM.materialProperties.find((entry) => entry.name === name);
    if (!material?.pbrMetallicRoughness?.baseColorFactor || !mtoon?.vectorProperties?._Color) {
      throw new Error(`Missing hand material: ${name}`);
    }
    material.pbrMetallicRoughness.baseColorFactor[3] = 1;
    mtoon.vectorProperties._Color[3] = 1;
  }
  const meshMap = new Map();
  json.meshes = json.meshes.filter((mesh, index) => {
    if (["LongSleevesL.baked", "LongSleevesR.baked"].includes(mesh.name)) {
      for (const primitive of mesh.primitives) {
        Object.values(primitive.attributes).forEach((accessor) => discardedAccessors.add(accessor));
        if (primitive.indices !== undefined) discardedAccessors.add(primitive.indices);
        primitive.targets?.forEach((target) => Object.values(target).forEach((accessor) => discardedAccessors.add(accessor)));
      }
      console.log(`Removed ${mesh.name}`);
      return false;
    }
    meshMap.set(index, meshMap.size);
    return true;
  });
  for (const node of json.nodes) {
    if (node.mesh === undefined) continue;
    if (meshMap.has(node.mesh)) node.mesh = meshMap.get(node.mesh);
    else { delete node.mesh; delete node.skin; }
  }
  for (const group of groups) {
    group.binds = (group.binds || []).filter((bind) => meshMap.has(bind.mesh)).map((bind) => ({ ...bind, mesh: meshMap.get(bind.mesh) }));
  }
  const firstPerson = json.extensions.VRM.firstPerson;
  if (firstPerson?.meshAnnotations) firstPerson.meshAnnotations = firstPerson.meshAnnotations.filter((entry) => meshMap.has(entry.mesh)).map((entry) => ({ ...entry, mesh: meshMap.get(entry.mesh) }));
}
json.meshes.forEach((mesh, meshIndex) => {
  const count = mesh.primitives[0].targets?.length || 0;
  if (!count) return;
  const keep = new Set(groups.flatMap((group) => group.binds || []).filter((bind) => bind.mesh === meshIndex).map((bind) => bind.index));
  // Preserve any nonzero default morph, even when it has no expression preset.
  mesh.weights?.forEach((weight, index) => { if (weight) keep.add(index); });
  json.nodes.filter((node) => node.mesh === meshIndex).forEach((node) => node.weights?.forEach((weight, index) => { if (weight) keep.add(index); }));
  const indices = [...keep].sort((a, b) => a - b);
  const remap = new Map(indices.map((index, next) => [index, next]));
  for (const primitive of mesh.primitives) {
    primitive.targets.forEach((target, index) => {
      if (!keep.has(index)) Object.values(target).forEach((accessor) => discardedAccessors.add(accessor));
    });
    if (indices.length) primitive.targets = indices.map((index) => primitive.targets[index]);
    else delete primitive.targets;
    if (primitive.extras?.targetNames) primitive.extras.targetNames = indices.map((index) => primitive.extras.targetNames[index]);
  }
  if (mesh.weights) {
    if (indices.length) mesh.weights = indices.map((index) => mesh.weights[index]);
    else delete mesh.weights;
  }
  if (mesh.extras?.targetNames) mesh.extras.targetNames = indices.map((index) => mesh.extras.targetNames[index]);
  json.nodes.filter((node) => node.mesh === meshIndex).forEach((node) => {
    if (node.weights) {
      if (indices.length) node.weights = indices.map((index) => node.weights[index]);
      else delete node.weights;
    }
  });
  groups.forEach((group) => group.binds?.forEach((bind) => {
    if (bind.mesh === meshIndex) bind.index = remap.get(bind.index);
  }));
  console.log(`${mesh.name}: ${count} -> ${indices.length} morph targets (${mode || "all presets"})`);
});

// Accessors can be shared, so only remove those no longer referenced.
const used = new Set();
json.meshes.forEach((mesh) => mesh.primitives.forEach((primitive) => {
  Object.values(primitive.attributes).forEach((index) => used.add(index));
  if (primitive.indices !== undefined) used.add(primitive.indices);
  primitive.targets?.forEach((target) => Object.values(target).forEach((index) => used.add(index)));
}));
json.skins?.forEach((skin) => { if (skin.inverseBindMatrices !== undefined) used.add(skin.inverseBindMatrices); });
const accessorMap = new Map();
json.accessors = json.accessors.filter((_, index) => {
  if (discardedAccessors.has(index) && !used.has(index)) return false;
  accessorMap.set(index, accessorMap.size);
  return true;
});
json.meshes.forEach((mesh) => mesh.primitives.forEach((primitive) => {
  for (const attribute of [primitive.attributes, ...(primitive.targets || [])]) {
    for (const key of Object.keys(attribute)) attribute[key] = accessorMap.get(attribute[key]);
  }
  if (primitive.indices !== undefined) primitive.indices = accessorMap.get(primitive.indices);
}));
json.skins?.forEach((skin) => { if (skin.inverseBindMatrices !== undefined) skin.inverseBindMatrices = accessorMap.get(skin.inverseBindMatrices); });

function visitViews(value, callback) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "bufferView") value[key] = callback(child);
    else if (key !== "bufferViews") visitViews(child, callback);
  }
}
const retainedViews = new Set();
visitViews(json, (index) => { retainedViews.add(index); return index; });
const viewMap = new Map();
const chunks = [];
let byteOffset = 0;
json.bufferViews = json.bufferViews.filter((view, index) => {
  if (!retainedViews.has(index)) return false;
  viewMap.set(index, viewMap.size);
  const data = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4);
  data.copy(padded);
  chunks.push(padded);
  view.byteOffset = byteOffset;
  byteOffset += padded.length;
  return true;
});
visitViews(json, (index) => viewMap.get(index));
json.buffers[0].byteLength = byteOffset;
const text = Buffer.from(JSON.stringify(json));
const paddedJson = Buffer.alloc(Math.ceil(text.length / 4) * 4, 0x20);
text.copy(paddedJson);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + paddedJson.length + byteOffset, 8);
header.writeUInt32LE(paddedJson.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(byteOffset, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
const result = Buffer.concat([header, paddedJson, binHeader, ...chunks]);
writeFileSync(output, result);
console.log(`${(source.length / 1048576).toFixed(2)} MB -> ${(result.length / 1048576).toFixed(2)} MB`);

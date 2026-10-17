// Extract the supplied staff geometry and color texture without importing Unity scripts.
// Usage: node scripts/prepare-nh02-staff.mjs source.unitypackage output.glb
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Provide the staff Unity package and output GLB path");
const tar = gunzipSync(readFileSync(input));
const entries = new Map();
for (let offset = 0; offset + 512 < tar.length;) {
  const name = tar.subarray(offset, offset + 100).toString().replace(/\0.*$/s, "");
  if (!name) break;
  const size = parseInt(tar.subarray(offset + 124, offset + 136).toString().replace(/\0.*$/s, "").trim(), 8) || 0;
  entries.set(name, tar.subarray(offset + 512, offset + 512 + size));
  offset += 512 + Math.ceil(size / 512) * 512;
}
function asset(filename) {
  for (const [name, data] of entries) {
    if (name.endsWith("/pathname") && data.toString().endsWith(`/${filename}`)) return entries.get(name.replace(/pathname$/, "asset"));
  }
  throw new Error(`Missing package asset: ${filename}`);
}

const temporary = mkdtempSync(join(tmpdir(), "nh02-staff-"));
try {
  const sourceTexture = join(temporary, "color.tga");
  const texturePath = join(temporary, "color.jpg");
  writeFileSync(sourceTexture, asset("T_030_006_a_stick_opt_col.tga"));
  // FBX textures use bottom-left UVs; embedded glTF images use top-left UVs.
  execFileSync("magick", [sourceTexture, "-resize", "1024x1024>", "-flip", "-alpha", "off", "-quality", "88", "-strip", texturePath]);
  const manager = new THREE.LoadingManager();
  // Offline geometry import; embed the actual supplied color map below.
  manager.addHandler(/.*/, { path: "", setPath(path) { this.path = path; return this; }, load() { return new THREE.Texture(); } });
  const bytes = asset("OB_030_nh02_stick.fbx");
  const staff = new FBXLoader(manager).parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  staff.name = "NH02_staff";
  staff.scale.setScalar(0.01); // The supplied FBX is in centimeters.
  staff.traverse((object) => {
    if (object.isMesh) {
      object.geometry = mergeVertices(object.geometry);
      object.material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.35, roughness: 0.55, side: THREE.DoubleSide });
    }
  });
  // GLTFExporter needs only Blob reading when exporting untextured geometry in Node.
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); }); }
  };
  const exported = Buffer.from(await new GLTFExporter().parseAsync(staff, { binary: true, onlyVisible: true }));
  const size = exported.readUInt32LE(12);
  const json = JSON.parse(exported.subarray(20, 20 + size));
  const geometry = exported.subarray(28 + size);
  const texture = readFileSync(texturePath);
  const textureData = Buffer.alloc(Math.ceil(texture.length / 4) * 4);
  texture.copy(textureData);
  const view = json.bufferViews.length;
  json.bufferViews.push({ buffer: 0, byteOffset: geometry.length, byteLength: texture.length });
  json.images = [{ bufferView: view, mimeType: "image/jpeg", name: "NH02_staff_color" }];
  json.textures = [{ source: 0 }];
  json.materials.forEach((material) => { material.pbrMetallicRoughness.baseColorTexture = { index: 0 }; });
  json.buffers[0].byteLength = geometry.length + textureData.length;
  const text = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(Math.ceil(text.length / 4) * 4, 0x20);
  text.copy(padded);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + padded.length + geometry.length + textureData.length, 8);
  header.writeUInt32LE(padded.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(json.buffers[0].byteLength, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  const result = Buffer.concat([header, padded, binHeader, geometry, textureData]);
  writeFileSync(output, result);
  console.log(`Staff: ${(result.length / 1048576).toFixed(2)} MB`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

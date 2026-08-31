import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const inputPath = process.argv[2];
const outputPath = process.argv[3] || inputPath;

if (!inputPath) throw new Error("Usage: node scripts/optimize-vrm-images.mjs input.vrm [output.vrm]");

function pad(buffer, fill = 0) {
  const paddedLength = Math.ceil(buffer.length / 4) * 4;
  if (paddedLength === buffer.length) return buffer;
  const padded = Buffer.alloc(paddedLength, fill);
  buffer.copy(padded);
  return padded;
}

const source = readFileSync(inputPath);
let json;
let binary;

for (let offset = 12; offset < source.length;) {
  const chunkLength = source.readUInt32LE(offset);
  const chunkType = source.readUInt32LE(offset + 4);
  const chunk = source.subarray(offset + 8, offset + 8 + chunkLength);
  if (chunkType === JSON_CHUNK) json = JSON.parse(chunk.toString("utf8"));
  if (chunkType === BIN_CHUNK) binary = chunk;
  offset += 8 + chunkLength;
}

if (!json || !binary) throw new Error("Expected a binary glTF/VRM with JSON and BIN chunks");

const temporaryDirectory = mkdtempSync(join(tmpdir(), "daivr-vrm-"));
const replacements = new Map();
let savedBytes = 0;

try {
  for (let imageIndex = 0; imageIndex < (json.images?.length || 0); imageIndex += 1) {
    const image = json.images[imageIndex];
    if (image.mimeType !== "image/png" || image.bufferView == null) continue;

    const view = json.bufferViews[image.bufferView];
    const imageBytes = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const width = imageBytes.readUInt32BE(16);
    const height = imageBytes.readUInt32BE(20);
    const maximumDimension = image.name === "Thumbnail" ? 256 : 1024;
    if (Math.max(width, height) <= maximumDimension) continue;

    const sourceImage = join(temporaryDirectory, `${imageIndex}-source.png`);
    const optimizedImage = join(temporaryDirectory, `${imageIndex}-optimized.png`);
    writeFileSync(sourceImage, imageBytes);
    execFileSync("magick", [
      sourceImage,
      "-filter", "Lanczos",
      "-resize", `${maximumDimension}x${maximumDimension}>`,
      "-strip",
      "-define", "png:compression-level=9",
      optimizedImage
    ]);

    const optimizedBytes = readFileSync(optimizedImage);
    replacements.set(image.bufferView, optimizedBytes);
    savedBytes += imageBytes.length - optimizedBytes.length;
    console.log(`${image.name || `image-${imageIndex}`}: ${width}x${height} -> max ${maximumDimension}px`);
  }

  const rebuiltViews = [];
  let byteOffset = 0;

  for (let viewIndex = 0; viewIndex < json.bufferViews.length; viewIndex += 1) {
    const view = json.bufferViews[viewIndex];
    const original = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const bytes = replacements.get(viewIndex) || original;
    const paddedBytes = pad(bytes);
    view.byteOffset = byteOffset;
    view.byteLength = bytes.length;
    rebuiltViews.push(paddedBytes);
    byteOffset += paddedBytes.length;
  }

  const rebuiltBinary = Buffer.concat(rebuiltViews);
  json.buffers[0].byteLength = rebuiltBinary.length;
  const jsonBytes = pad(Buffer.from(JSON.stringify(json)), 0x20);
  const totalLength = 12 + 8 + jsonBytes.length + 8 + rebuiltBinary.length;
  const output = Buffer.alloc(totalLength);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);
  output.writeUInt32LE(jsonBytes.length, 12);
  output.writeUInt32LE(JSON_CHUNK, 16);
  jsonBytes.copy(output, 20);
  const binHeader = 20 + jsonBytes.length;
  output.writeUInt32LE(rebuiltBinary.length, binHeader);
  output.writeUInt32LE(BIN_CHUNK, binHeader + 4);
  rebuiltBinary.copy(output, binHeader + 8);
  writeFileSync(outputPath, output);
  console.log(`${basename(inputPath)}: ${(source.length / 1048576).toFixed(2)} MB -> ${(output.length / 1048576).toFixed(2)} MB (${(savedBytes / 1048576).toFixed(2)} MB image reduction)`);
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}

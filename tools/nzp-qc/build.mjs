// Rebuilds public/nzp/progs/{menu,csprogs,qwprogs}.dat: NZ:P's GPL-2 QuakeC at
// UPSTREAM_COMMIT plus daivr.patch, compiled with the FTEQCC binary that ships in
// that same upstream commit. Needs network, tar and git. See README.md.
//
//   node tools/nzp-qc/build.mjs
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The commit nzp.gay's web build was compiled from (its progs.pk3 dates from
// 2026-09-03; this is the last QuakeC commit before it). The engine and game.pk3
// still come from nzp.gay, so keep the two in step when re-pinning.
export const UPSTREAM_COMMIT = "7ab55bf7c4dbd3550921687ab7a002d0d8f7a7aa";
export const PROGS = ["menu.dat", "csprogs.dat", "qwprogs.dat"];
const COMPILERS = { win32: "fteqcc-cli-win.exe", darwin: "fteqcc-cli-mac", linux: "fteqcc-cli-lin" };
// Same flags as upstream tools/qc-compiler-gnu.sh for the FTE (desktop/WebGL) build.
const TARGETS = [["csqc", ["-DFTE", "-Wall"]], ["ssqc", ["-O3", "-DFTE", "-Wall"]], ["menu", ["-O3", "-DFTE", "-Wall"]]];

// Port of upstream bin/qc_hash_generator.py (it needs Python with pandas and
// fastcrc): CRC-16/IBM-3740 of the first CSV column, sorted ascending.
export function crc16(text) {
  let crc = 0xffff;
  for (const byte of Buffer.from(text)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

export function hashTableQc(csv) {
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  const columns = header.split(",");
  const entries = rows
    .map((line) => line.split(","))
    .map((cells) => ({ crc: crc16(cells[0]), cells }))
    .sort((a, b) => a.crc - b.crc);
  const fields = [`float ${columns[0]}_crc;`, ...columns.slice(1).map((column) => `string ${column};`), "float crc_strlen;"];
  const values = entries.map(({ crc, cells }, index) =>
    `{${crc},${cells.slice(1).map((cell) => `"${cell}"`).join(",")},${cells[0].length}}${index + 1 < entries.length ? "," : ""} // ${cells[0]}`);
  return `var struct {\n${fields.join("\n")}\n}asset_conversion_table[]={\n${values.join("\n")}\n};\n`;
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const output = resolve(here, "../../public/nzp/progs");
  const compiler = COMPILERS[process.platform];
  if (!compiler) throw new Error(`No FTEQCC binary for ${process.platform}.`);
  const work = mkdtempSync(join(tmpdir(), "nzp-qc-"));
  try {
    const response = await fetch(`https://codeload.github.com/nzp-team/quakec/tar.gz/${UPSTREAM_COMMIT}`);
    if (!response.ok) throw new Error(`Could not download nzp-team/quakec@${UPSTREAM_COMMIT} (${response.status}).`);
    writeFileSync(join(work, "quakec.tar.gz"), Buffer.from(await response.arrayBuffer()));
    const source = join(work, "quakec");
    mkdirSync(source);
    execFileSync("tar", ["-xzf", "../quakec.tar.gz", "--strip-components=1"], { cwd: source, stdio: "inherit" });
    execFileSync("git", ["apply", "--whitespace=nowarn", join(here, "daivr.patch")], { cwd: source, stdio: "inherit" });
    writeFileSync(join(source, "source/server/hash_table.qc"), hashTableQc(readFileSync(join(source, "tools/asset_conversion_table.csv"), "utf8")));

    const binary = join(source, "bin", compiler);
    if (process.platform !== "win32") chmodSync(binary, 0o755);
    mkdirSync(join(source, "build/fte"), { recursive: true });
    for (const [target, flags] of TARGETS) {
      const log = execFileSync(binary, [...flags, "-srcfile", `../progs/${target}.src`], { cwd: join(source, "bin"), encoding: "latin1" });
      const issues = log.split(/\r?\n/).filter((line) => /warning|error/i.test(line) && !/^Done\./.test(line.trim()));
      console.log(`${target}: ${issues.length ? `\n  ${issues.join("\n  ")}` : "clean"}`);
      if (issues.some((line) => /error/i.test(line))) throw new Error(`${target} failed to compile.`);
    }
    mkdirSync(output, { recursive: true });
    for (const file of PROGS) copyFileSync(join(source, "build/fte", file), join(output, file));
    console.log(`Wrote ${PROGS.join(", ")} to ${output}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

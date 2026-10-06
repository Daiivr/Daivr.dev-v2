// Runtime-only customization of the upstream menu (menu.dat). The original
// engine/assets remain upstream downloads. Equivalent QuakeC source changes:
// - void(...) Menu_SocialBadge = { return; };  removes both social icons and
//   their mouse hit areas without cropping any gameplay.
// - void() Menu_GetBuildDate = { return; };  build_datetime stays empty, so the
//   main menu no longer shows the build number above "Welcome, <name>".
// - Menu_Main drops its last Menu_DrawDivider + the CREDITS Menu_Button.
// - menu_main_buttons = {"mm_start", "mm_coop", "mm_options", "mm_bios",
//   "mm_quit", "mm_start"};  arrow keys skip the removed button: down from Bios
//   wraps to Solo (the web build has no Quit), up from Solo stays there.
// Source: https://github.com/nzp-team/quakec/tree/main/source/menu
// (m_menu.qc, main.qc, menu_main.qc)
const OP_RETURN = 43, OP_STORE_F = 31, OP_STORE_S = 33, OP_GOTO = 61, OP_CALL1H = 105, OP_CALL8H = 112;
const MAIN_BUTTONS = ["mm_start", "mm_coop", "mm_options", "mm_bios", "mm_credits", "mm_quit"];
const changed = () => new Error("NZ:P's menu changed. The clean menu needs an update.");

function readPrograms(bytes) {
  const copy = bytes.slice();
  const view = new DataView(copy.buffer, copy.byteOffset, copy.byteLength);
  if (copy.length < 92 || ![6, 7].includes(view.getInt32(0, true))) throw new Error("Unsupported NZ:P menu format.");
  const statements = view.getInt32(8, true), statementCount = view.getInt32(12, true);
  const functions = view.getInt32(32, true), functionCount = view.getInt32(36, true);
  const strings = view.getInt32(40, true), stringCount = view.getInt32(44, true);
  const globals = view.getInt32(48, true), globalCount = view.getInt32(52, true);
  if (statements < 0 || functions < 0 || strings < 0 || globals < 0 || globalCount < 0 || statementCount < 1 || functionCount < 1 || stringCount < 1
    || statements + statementCount * 8 !== functions || functions + functionCount * 36 > copy.length || strings + stringCount > copy.length
    || globals + globalCount * 4 > copy.length) {
    throw new Error("Unsupported NZ:P menu tables.");
  }
  const decoder = new TextDecoder();
  const string = (offset) => {
    if (offset < 0 || offset >= stringCount) return null;
    const start = strings + offset, end = copy.indexOf(0, start);
    return end < start || end >= strings + stringCount ? null : decoder.decode(copy.subarray(start, end));
  };
  const firsts = Array.from({ length: functionCount }, (_, index) => view.getInt32(functions + index * 36, true));
  const names = Array.from({ length: functionCount }, (_, index) => string(view.getInt32(functions + index * 36 + 16, true)));
  const globalAt = (index) => {
    if (index < 0 || index >= globalCount) throw changed();
    return globals + index * 4;
  };
  const statementAt = (index) => statements + index * 8;
  const program = {
    copy,
    op: (index) => view.getUint16(statementAt(index), true),
    // Operand 0 is a, 1 is b, 2 is c. Global operands are unsigned; GOTO offsets are signed.
    operand: (index, slot) => view.getUint16(statementAt(index) + 2 + slot * 2, true),
    jump: (index) => view.getInt16(statementAt(index) + 2, true),
    int: (global) => view.getInt32(globalAt(global), true),
    setInt: (global, value) => view.setInt32(globalAt(global), value, true),
    string,
    setStatement(index, op, a = 0) {
      view.setUint16(statementAt(index), op, true);
      view.setInt16(statementAt(index) + 2, a, true);
      view.setUint32(statementAt(index) + 4, 0, true);
    },
    indexOf: (name) => names.indexOf(name),
    // Statement range [first, end) of a QuakeC function: up to the next function body.
    find(name) {
      const index = names.indexOf(name), first = firsts[index];
      if (index < 0 || first < 1 || first >= statementCount) throw changed();
      const end = Math.min(statementCount, ...firsts.filter((start) => start > first));
      return { first, end };
    }
  };
  return program;
}

// OP_DONE with zero operands returns immediately in the QuakeC VM.
function stub(program, name) {
  program.setStatement(program.find(name).first, 0);
}

function removeCredits(program) {
  const { op, operand, int, string } = program;
  const main = program.find("Menu_Main"), button = program.indexOf("Menu_Button"), divider = program.indexOf("Menu_DrawDivider");
  // FTEQCC's CALLnH opcodes take the function in a, parm0 in b and parm1 in c.
  const calls = (index, target) => op(index) >= OP_CALL1H && op(index) <= OP_CALL8H && int(operand(index, 0)) === target;
  let call = main.first;
  while (call < main.end && !(calls(call, button) && string(int(operand(call, 2))) === "mm_credits")) call++;
  if (call === main.end) throw changed();
  // The button's remaining parameters are stored into the parm globals just before the call.
  let start = call;
  while (start > main.first && op(start - 1) >= OP_STORE_F && op(start - 1) <= OP_STORE_S && operand(start - 1, 1) >= 4 && operand(start - 1, 1) < 28) start--;
  if (start > main.first && calls(start - 1, divider)) start--;
  // `Menu_Button(...) ? current_menu = MENU_CREDITS : 0;` ends with a GOTO past its else branch.
  let exit = call + 1;
  while (exit < Math.min(call + 8, main.end) && op(exit) !== OP_GOTO) exit++;
  const end = exit + program.jump(exit);
  if (op(exit) !== OP_GOTO || end <= exit || end > main.end) throw changed();
  program.setStatement(start, OP_GOTO, end - start);
}

function skipCreditsInNavigation(program) {
  const next = program.find("Menu_Main_GetNextButton");
  let index = next.first;
  while (index < next.end && program.op(index) !== OP_RETURN) index++;
  if (index === next.end) throw changed();
  // `return menu_main_buttons[0];` points at the array's first global.
  const base = program.operand(index, 0);
  const ids = MAIN_BUTTONS.map((_, slot) => program.int(base + slot));
  if (MAIN_BUTTONS.some((id, slot) => program.string(ids[slot]) !== id)) throw changed();
  program.setInt(base + 4, ids[5]);
  program.setInt(base + 5, ids[0]);
}

export function removeSocialBadges(bytes) {
  const program = readPrograms(bytes);
  stub(program, "Menu_SocialBadge");
  return program.copy;
}

export function cleanMenu(bytes) {
  const program = readPrograms(bytes);
  stub(program, "Menu_SocialBadge");
  stub(program, "Menu_GetBuildDate");
  removeCredits(program);
  skipCreditsInNavigation(program);
  return program.copy;
}

export async function unpackPrograms(buffer) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  if (bytes.length > 4_000_000 || bytes.length < 22) throw new Error("Invalid NZ:P program archive.");
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < Math.max(0, bytes.length - 65557)) throw new Error("Missing NZ:P archive directory.");
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  if (count > 32) throw new Error("Unexpected NZ:P program archive.");
  const files = {};
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50) throw new Error("Invalid NZ:P archive entry.");
    const method = view.getUint16(cursor + 10, true), size = view.getUint32(cursor + 20, true);
    const expanded = view.getUint32(cursor + 24, true), length = view.getUint16(cursor + 28, true);
    const offset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + length));
    cursor += 46 + length + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
    if (!/^(?:menu|csprogs|qwprogs)\.(?:dat|lno)$/.test(name)) continue;
    if (expanded > 4_000_000 || offset + 30 > bytes.length || view.getUint32(offset, true) !== 0x04034b50) throw new Error("Invalid NZ:P program file.");
    const start = offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true);
    if (start + size > bytes.length) throw new Error("Truncated NZ:P program file.");
    let data = bytes.slice(start, start + size);
    if (method === 8) data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    else if (method !== 0) throw new Error("Unsupported NZ:P archive compression.");
    if (data.length !== expanded) throw new Error("Incomplete NZ:P download.");
    if (name === "menu.dat") data = cleanMenu(data);
    files[`nzp/${name}`] = data.buffer;
  }
  if (!files["nzp/menu.dat"] || !files["nzp/csprogs.dat"] || !files["nzp/qwprogs.dat"]) throw new Error("Missing NZ:P programs.");
  return files;
}

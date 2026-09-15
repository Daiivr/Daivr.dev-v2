import test from "node:test";
import assert from "node:assert/strict";
import { AmbientLight, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Texture } from "three";
import { warmAvatarResources } from "../src/lib/avatarWarmup.js";

globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);

function fixture() {
  const scene = new Scene();
  scene.add(new AmbientLight());
  const root = new Group();
  const texture = new Texture();
  const material = new MeshBasicMaterial({ map: texture });
  root.add(new Mesh(undefined, material), new Mesh(undefined, material));
  const calls = [];
  const renderer = {
    initTexture(value) { calls.push(["texture", value]); },
    async compileAsync(object, camera, target) {
      assert.equal(object.parent, null, "compilation must not expose the model to the live frame loop");
      assert.equal(target, scene);
      calls.push(["compile"]);
    },
    render(warmScene) {
      assert.notEqual(warmScene, scene);
      const visible = [];
      warmScene.traverseVisible((object) => { if (object.isMesh) visible.push(object); });
      assert.equal(visible.length, 1, "upload only one mesh in each work slice");
      calls.push(["render"]);
    },
  };
  return { renderer, root, scene, camera: new PerspectiveCamera(), calls, onProgress() {} };
}

test("avatar warm-up deduplicates textures and keeps GPU preparation off the live scene", async () => {
  const data = fixture();
  assert.equal(await warmAvatarResources({ ...data, cancelled: () => false }), true);
  assert.deepEqual(data.calls.map(([name]) => name), ["texture", "compile", "render", "render"]);
  assert.equal(data.root.parent, null);
  assert.ok(data.root.children.every((mesh) => mesh.visible));
});

test("leaving during warm-up restores the model and stops further uploads", async () => {
  const data = fixture();
  const cancelled = () => data.calls.some(([name]) => name === "render");
  assert.equal(await warmAvatarResources({ ...data, cancelled }), false);
  assert.equal(data.calls.filter(([name]) => name === "render").length, 1);
  assert.equal(data.root.parent, null);
  assert.ok(data.root.children.every((mesh) => mesh.visible));
});

test("a failed warm-up restores visibility and detaches the temporary scene", async () => {
  const data = fixture();
  data.renderer.render = () => { throw new Error("GPU unavailable"); };
  await assert.rejects(warmAvatarResources({ ...data, cancelled: () => false }), /GPU unavailable/);
  assert.equal(data.root.parent, null);
  assert.ok(data.root.children.every((mesh) => mesh.visible));
});

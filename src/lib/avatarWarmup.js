import { Scene } from "three";

// Let the gate paint between GPU uploads instead of doing them all on its first frame.
export function yieldAvatarWork() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

export async function warmAvatarResources({ renderer, root, scene, camera, cancelled, onProgress }) {
  const textures = new Set();
  const meshes = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    meshes.push({ object, visible: object.visible });
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material || {})) if (value?.isTexture) textures.add(value);
      for (const uniform of Object.values(material?.uniforms || {})) if (uniform?.value?.isTexture) textures.add(uniform.value);
    }
  });
  let uploaded = 0;
  for (const texture of textures) {
    await yieldAvatarWork();
    if (cancelled()) return false;
    renderer.initTexture(texture);
    onProgress(82 + (++uploaded / textures.size) * 8);
  }

  // Keep the model out of the live R3F scene while compilation is pending.
  // Adding it there early lets the regular frame loop render unfinished shaders.
  await renderer.compileAsync(root, camera, scene);
  if (cancelled()) return false;
  onProgress(94);

  const warmScene = new Scene();
  scene.traverse((object) => { if (object.isLight) warmScene.add(object.clone()); });
  warmScene.add(root);
  meshes.forEach(({ object }) => { object.visible = false; });
  try {
    for (let index = 0; index < meshes.length; index++) {
      await yieldAvatarWork();
      if (cancelled()) return false;
      const { object, visible } = meshes[index];
      object.visible = visible;
      // The canvas is still concealed. This initializes geometry, skinning,
      // and morph buffers using the same output format as the visible frame.
      renderer.render(warmScene, camera);
      object.visible = false;
      onProgress(94 + ((index + 1) / meshes.length) * 4);
    }
  } finally {
    meshes.forEach(({ object, visible }) => { object.visible = visible; });
    warmScene.remove(root);
  }
  return true;
}

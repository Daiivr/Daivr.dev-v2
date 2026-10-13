export const DEFAULT_HOST_AVATAR = "/models/dai-greeter-optimized.vrm";
export const MIKU_HOST_AVATAR = "/models/miku-rabbit-greeter.vrm";

export function getHostAvatar({ unlockedGear = [], hiddenGear = [] } = {}) {
  return unlockedGear.includes("miku-costume") && !hiddenGear.includes("miku-costume")
    ? MIKU_HOST_AVATAR
    : DEFAULT_HOST_AVATAR;
}

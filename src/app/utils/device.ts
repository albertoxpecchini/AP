export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPod|iPad/.test(navigator.userAgent) ||
    // iPadOS 13+ si maschera da macOS ma ha touch points
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

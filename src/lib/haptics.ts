/**
 * Trigger haptic feedback on supported devices.
 * Uses the Web Vibration API — silently fails on unsupported browsers.
 */
export function hapticTap() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

export function hapticSuccess() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
}

export function hapticError() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([30, 50, 30]);
  }
}

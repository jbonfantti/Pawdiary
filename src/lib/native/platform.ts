const IOS_NATIVE_UA = /PawDiaryApp\/[\d.]+ \(ios\)/;
const ANDROID_NATIVE_UA = /PawDiaryApp\/[\d.]+ \(android\)/;

export function isIosNativeShell(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return IOS_NATIVE_UA.test(userAgent);
}

export function isAndroidNativeShell(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return ANDROID_NATIVE_UA.test(userAgent);
}

export function isNativeShell(userAgent: string | null): boolean {
  return isIosNativeShell(userAgent) || isAndroidNativeShell(userAgent);
}

export function resolve(...segments: string[]) {
  return segments.filter(Boolean).join("/");
}

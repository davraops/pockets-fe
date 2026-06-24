export const CUADERNO_AUTOSAVE_MS = 1500

export function isCuadernoPayloadDirty(
  payload: { title: string; content: string },
  lastSaved: { title: string; content: string }
): boolean {
  return payload.title !== lastSaved.title || payload.content !== lastSaved.content
}

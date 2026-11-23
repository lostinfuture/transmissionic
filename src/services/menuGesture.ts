export function computeMenuMaxEdgeStart(viewportWidth: number): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return 240;
  }
  // Allow opening the left overlay menu from swipes starting past the center
  // of the screen so mobile edge-back gestures do not fight the drawer.
  return Math.max(180, Math.round(viewportWidth * 0.65));
}

export type SwiperLayoutAction = "mount" | "update" | "wait";

// A swiper created at 0×0 stays blank in Firefox after display:none (#1404).
export function swiperAction(
  width: number,
  height: number,
  mounted: boolean,
  lastWidth: number,
  lastHeight: number
): SwiperLayoutAction {
  if (!(width > 0 && height > 0)) return "wait";
  if (!mounted) return "mount";
  if (width !== lastWidth || height !== lastHeight) return "update";
  return "wait";
}

// The writer and fixed SQL report queries share this positional contract.
// Keyboard events use -1 for spatial doubles; queries must filter kind before
// plotting cells. Analytics Engine adds timestamp and _sample_interval itself.
export const HEATMAP_DATASET = 'site_click_events';
export const HEATMAP_COLUMNS = Object.freeze({
  page: 'index1',
  target: 'blob1',
  layout: 'blob2',
  build: 'blob3',
  viewport: 'blob4',
  theme: 'blob5',
  state: 'blob6',
  kind: 'blob7',
  version: 'double1',
  time: 'double2',
  x: 'double3',
  y: 'double4',
  pageX: 'double5',
  pageY: 'double6',
});

/** @param {import('../../shared/heatmap-contract.js').HeatmapEvent} event */
export function toHeatmapDataPoint(event) {
  const spatial =
    event.kind === 'pointer'
      ? [event.x, event.y, event.pageX, event.pageY]
      : [-1, -1, -1, -1];
  return {
    indexes: [event.page],
    blobs: [
      event.target,
      event.layout,
      event.build,
      event.viewport,
      event.theme,
      event.state,
      event.kind,
    ],
    doubles: [event.version, event.time, ...spatial],
  };
}

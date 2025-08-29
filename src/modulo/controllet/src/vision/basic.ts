// Ultra-light vision stubs: no heavy deps, just metadata and simple heuristics
// The client computes basic info (width/height) via canvas and sends it if needed.

export type VisionAnalysis = {
  kind: 'image' | 'video-frame';
  bytes: number;
  note: string;
};

export function analyzeBase64(dataUrlOrBase64: string, kind: 'image' | 'video-frame' = 'image'): VisionAnalysis {
  // Accept either pure base64 or data URL
  const commaIdx = dataUrlOrBase64.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrlOrBase64.slice(commaIdx + 1) : dataUrlOrBase64;
  const bytes = Math.floor((base64.length * 3) / 4);
  const note = kind === 'image' ? 'Imagen recibida' : 'Frame de video recibido';
  return { kind, bytes, note };
}
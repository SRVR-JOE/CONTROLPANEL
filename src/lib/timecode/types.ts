// ============================================================
// LTC / SMPTE Timecode types
// ============================================================

export type FrameRate =
  | '23.976'
  | '24'
  | '25'
  | '29.97df'
  | '29.97ndf'
  | '30';

export interface Timecode {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
}

export type GeneratorStatus = 'stopped' | 'running' | 'error';

export interface TimecodeGeneratorState {
  running: boolean;
  timecode: Timecode;
  frameRate: FrameRate;
  outputDeviceId: string | null;
  status: GeneratorStatus;
  error: string | null;
}

// Human-readable labels for frame rates
export const FRAME_RATE_LABELS: Record<FrameRate, string> = {
  '23.976': '23.976 fps',
  '24': '24 fps',
  '25': '25 fps',
  '29.97df': '29.97 DF',
  '29.97ndf': '29.97 NDF',
  '30': '30 fps',
};

// Whether a frame rate is drop-frame
export function isDropFrame(fr: FrameRate): boolean {
  return fr === '29.97df';
}

// Nominal frames per second (integer) used for bit timing and display limits
export function nominalFps(fr: FrameRate): number {
  switch (fr) {
    case '23.976': return 24;
    case '24':     return 24;
    case '25':     return 25;
    case '29.97df':
    case '29.97ndf':
    case '30':     return 30;
  }
}

// Actual audio samples per frame at a given sample rate
export function samplesPerFrame(fr: FrameRate, sampleRate: number): number {
  switch (fr) {
    case '23.976':  return sampleRate / (24000 / 1001);
    case '24':      return sampleRate / 24;
    case '25':      return sampleRate / 25;
    case '29.97df':
    case '29.97ndf':return sampleRate / (30000 / 1001);
    case '30':      return sampleRate / 30;
  }
}

// ============================================================
// Drop-frame frame number arithmetic (SMPTE standard)
// ============================================================

/**
 * Converts a Timecode to a monotonically increasing frame count.
 * For drop-frame, frames 0 and 1 are skipped at the start of each
 * minute except every 10th minute.
 */
export function timecodeToFrameNumber(tc: Timecode, fr: FrameRate): number {
  const fps = nominalFps(fr);
  const totalFrames =
    tc.hours * 3600 * fps +
    tc.minutes * 60 * fps +
    tc.seconds * fps +
    tc.frames;

  if (!isDropFrame(fr)) return totalFrames;

  // Drop-frame correction: subtract dropped frames
  const totalMinutes = 60 * tc.hours + tc.minutes;
  const dropped = 2 * (totalMinutes - Math.floor(totalMinutes / 10));
  return totalFrames - dropped;
}

/**
 * Converts a frame count back to a Timecode for a given frame rate.
 */
export function frameNumberToTimecode(frameNum: number, fr: FrameRate): Timecode {
  const fps = nominalFps(fr);

  if (!isDropFrame(fr)) {
    let n = frameNum;
    const frames  = n % fps;       n = Math.floor(n / fps);
    const seconds = n % 60;        n = Math.floor(n / 60);
    const minutes = n % 60;        n = Math.floor(n / 60);
    const hours   = n % 24;
    return { hours, minutes, seconds, frames };
  }

  // Drop-frame reconstruction (SMPTE 12M)
  // D = drop count per minute = 2 (for 29.97)
  // framesPer10Min = 10 * 60 * 30 - 9 * 2 = 17982
  const D = 2;
  const framesPer10Min = fps * 10 * 60 - D * 9; // 17982 for 29.97
  const framesPerMin   = fps * 60 - D;           // 1798 for 29.97

  let n = frameNum;
  const tens    = Math.floor(n / framesPer10Min); n = n % framesPer10Min;
  const units   = Math.floor(Math.max(n - D, 0) / framesPerMin);
  n = n - units * framesPerMin - (units > 0 ? D : 0);

  const frames  = n % fps;        n = Math.floor(n / fps);
  const seconds = n % 60;        n = Math.floor(n / 60);
  const minutes = tens * 10 + units;
  const hours   = Math.floor(minutes / 60) % 24;

  return {
    hours:   hours,
    minutes: minutes % 60,
    seconds,
    frames,
  };
}

/**
 * Advance a timecode by exactly one frame, handling rollover and
 * drop-frame skipping.
 */
export function advanceOneFrame(tc: Timecode, fr: FrameRate): Timecode {
  const n = timecodeToFrameNumber(tc, fr) + 1;
  return frameNumberToTimecode(n, fr);
}

/**
 * Validate and clamp raw HH:MM:SS:FF values for a given frame rate.
 */
export function clampTimecode(tc: Timecode, fr: FrameRate): Timecode {
  const fps = nominalFps(fr);
  return {
    hours:   Math.max(0, Math.min(23, tc.hours)),
    minutes: Math.max(0, Math.min(59, tc.minutes)),
    seconds: Math.max(0, Math.min(59, tc.seconds)),
    frames:  Math.max(0, Math.min(fps - 1, tc.frames)),
  };
}

/**
 * Format a Timecode as a display string.
 * Drop-frame uses semicolons between seconds and frames (convention).
 */
export function formatTimecode(tc: Timecode, fr: FrameRate): string {
  const sep = isDropFrame(fr) ? ';' : ':';
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(tc.hours)}:${pad(tc.minutes)}:${pad(tc.seconds)}${sep}${pad(tc.frames)}`;
}

/** Parse a timecode string "HH:MM:SS:FF" or "HH:MM:SS;FF" */
export function parseTimecodeString(s: string): Timecode | null {
  const m = s.match(/^(\d{1,2})[:;](\d{1,2})[:;](\d{1,2})[:;](\d{1,2})$/);
  if (!m) return null;
  return {
    hours:   parseInt(m[1], 10),
    minutes: parseInt(m[2], 10),
    seconds: parseInt(m[3], 10),
    frames:  parseInt(m[4], 10),
  };
}

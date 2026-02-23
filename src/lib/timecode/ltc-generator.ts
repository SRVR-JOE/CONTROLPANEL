/**
 * LTC (Linear Timecode / SMPTE) Generator
 *
 * Produces a standards-compliant SMPTE 12M LTC audio signal using the
 * Web Audio API. The signal is Manchester bi-phase encoded at ~-10 dBFS
 * and can be decoded by professional equipment and software.
 *
 * LTC Frame structure (80 bits, LSB-first per group):
 *   Bits  0– 3  Frames units   (BCD)
 *   Bits  4– 5  Frames tens    (BCD)
 *   Bit   6     Drop frame flag
 *   Bit   7     Color frame flag
 *   Bits  8–11  Seconds units  (BCD)
 *   Bits 12–14  Seconds tens   (BCD)
 *   Bit  15     Phase correction bit
 *   Bits 16–19  Minutes units  (BCD)
 *   Bits 20–22  Minutes tens   (BCD)
 *   Bit  23     Binary group flag 1
 *   Bits 24–27  Hours units    (BCD)
 *   Bits 28–29  Hours tens     (BCD)
 *   Bits 30–31  Unassigned / BGF
 *   Bits 32–63  User bits (8 groups × 4 bits) — set to 0
 *   Bits 64–79  Sync word: 0011 1111 1111 1101 (fixed)
 *
 * Manchester bi-phase encoding:
 *   Every bit period has a transition at its START (bit clock).
 *   A logical '1' has an ADDITIONAL transition at the MIDPOINT.
 *   A logical '0' has NO midpoint transition.
 *
 * Signal level: ~-10 dBFS (amplitude ≈ 0.316 relative to full scale).
 */

import {
  type FrameRate,
  type Timecode,
  isDropFrame,
  samplesPerFrame,
  timecodeToFrameNumber,
  frameNumberToTimecode,
} from './types';

// LTC output amplitude: -10 dBFS
const LTC_AMPLITUDE = 0.316;

// Sync word: bits 64–79, transmitted LSB-first within the word
// Value 0x3FFD = 0011 1111 1111 1101 — but note LTC transmits bits LSB-first
// within the frame so the sync word bits are laid out as:
//   bit64=1, bit65=0, bit66=1, bit67=1, bit68=1, bit69=1, bit70=1, bit71=1,
//   bit72=1, bit73=1, bit74=1, bit75=1, bit76=1, bit77=1, bit78=0, bit79=0
// (the fixed SMPTE sync word 0xBFFC when read MSB-first = 1011 1111 1111 1100)
// Represented as array[64..79]:
const SYNC_WORD = [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0];

/**
 * Build the 80-bit LTC frame for a given timecode position.
 * Returns an array of 80 values, each 0 or 1.
 */
function buildLTCFrame(tc: Timecode, fr: FrameRate): Uint8Array {
  const frame = new Uint8Array(80);
  const df = isDropFrame(fr) ? 1 : 0;

  // Helper: write BCD nibble into frame starting at bitOffset, numBits wide
  const writeBCD = (value: number, bitOffset: number, numBits: number) => {
    for (let i = 0; i < numBits; i++) {
      frame[bitOffset + i] = (value >> i) & 1;
    }
  };

  // Frames units  (bits 0–3)
  writeBCD(tc.frames % 10, 0, 4);
  // Frames tens   (bits 4–5)
  writeBCD(Math.floor(tc.frames / 10), 4, 2);
  // Drop frame flag (bit 6)
  frame[6] = df;
  // Color frame flag (bit 7) = 0
  frame[7] = 0;

  // Seconds units (bits 8–11)
  writeBCD(tc.seconds % 10, 8, 4);
  // Seconds tens  (bits 12–14)
  writeBCD(Math.floor(tc.seconds / 10), 12, 3);
  // Phase correction (bit 15) — maintain even parity across first 64 bits
  // We'll compute it after filling the rest.
  frame[15] = 0;

  // Minutes units (bits 16–19)
  writeBCD(tc.minutes % 10, 16, 4);
  // Minutes tens  (bits 20–22)
  writeBCD(Math.floor(tc.minutes / 10), 20, 3);
  // BGF1 (bit 23) = 0
  frame[23] = 0;

  // Hours units   (bits 24–27)
  writeBCD(tc.hours % 10, 24, 4);
  // Hours tens    (bits 28–29)
  writeBCD(Math.floor(tc.hours / 10), 28, 2);
  // Bits 30–31: unassigned / BGF = 0
  frame[30] = 0;
  frame[31] = 0;

  // User bits (bits 32–63) = 0 (already zeroed)

  // Sync word (bits 64–79)
  for (let i = 0; i < 16; i++) {
    frame[64 + i] = SYNC_WORD[i];
  }

  // Phase correction bit (bit 15): ensure the count of 1-bits in bits 0–63
  // (excluding bit 15) is even.
  let ones = 0;
  for (let i = 0; i < 64; i++) {
    if (i !== 15) ones += frame[i];
  }
  frame[15] = ones % 2 === 0 ? 0 : 1;

  return frame;
}

/**
 * Render one LTC frame into a Float32Array of audio samples.
 * Uses Manchester bi-phase encoding.
 *
 * @param frame      80-bit LTC frame
 * @param numSamples Exact number of samples this frame should produce
 * @param polarity   Current polarity (+1 or -1) entering this frame
 * @returns { samples, exitPolarity }
 */
function renderLTCFrame(
  frame: Uint8Array,
  numSamples: number,
  polarity: number
): { samples: Float32Array<ArrayBuffer>; exitPolarity: number } {
  const samples: Float32Array<ArrayBuffer> = new Float32Array(numSamples);
  const samplesPerBit = numSamples / 80;
  let currentPolarity = polarity;
  let sampleIndex = 0;

  for (let bit = 0; bit < 80; bit++) {
    const bitStartSample = Math.round(bit * samplesPerBit);
    const bitEndSample   = Math.round((bit + 1) * samplesPerBit);
    const bitMidSample   = Math.round((bitStartSample + bitEndSample) / 2);
    const bitValue       = frame[bit];

    // Transition at start of every bit (bit clock edge)
    currentPolarity = -currentPolarity;

    // Fill first half of bit
    for (let s = bitStartSample; s < bitMidSample && s < numSamples; s++) {
      samples[s] = currentPolarity * LTC_AMPLITUDE;
    }

    // For a '1' bit: additional transition at midpoint
    if (bitValue === 1) {
      currentPolarity = -currentPolarity;
    }

    // Fill second half of bit
    for (let s = bitMidSample; s < bitEndSample && s < numSamples; s++) {
      samples[s] = currentPolarity * LTC_AMPLITUDE;
    }

    sampleIndex = bitEndSample;
  }
  // Fill any remaining samples (rounding slop)
  for (let s = sampleIndex; s < numSamples; s++) {
    samples[s] = currentPolarity * LTC_AMPLITUDE;
  }

  return { samples, exitPolarity: currentPolarity };
}

// ============================================================
// LTC Generator class
// ============================================================

export class LTCGenerator {
  private frameRate: FrameRate;
  private sampleRate: number;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private running: boolean = false;
  private currentFrameNumber: number = 0;
  private polarity: number = 1;
  private nextScheduledTime: number = 0;
  // How many seconds of audio to schedule ahead of playback position
  private readonly SCHEDULE_AHEAD_TIME = 0.2;
  private scheduleTimer: ReturnType<typeof setTimeout> | null = null;

  /** Called on every new frame tick with the current timecode */
  public onFrame?: (tc: Timecode) => void;
  /** Called when an error occurs */
  public onError?: (err: Error) => void;

  constructor(frameRate: FrameRate, sampleRate = 48000) {
    this.frameRate = frameRate;
    this.sampleRate = sampleRate;
  }

  setFrameRate(fr: FrameRate): void {
    const wasRunning = this.running;
    if (wasRunning) this.stop();
    this.frameRate = fr;
  }

  setTimecode(hours: number, minutes: number, seconds: number, frames: number): void {
    this.currentFrameNumber = timecodeToFrameNumber(
      { hours, minutes, seconds, frames },
      this.frameRate
    );
  }

  getCurrentTimecode(): Timecode {
    return frameNumberToTimecode(this.currentFrameNumber, this.frameRate);
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Start generating LTC audio to the specified output device.
   * Uses AudioContext.setSinkId() (Chrome 110+) to route to a specific device.
   * Falls back to the system default when setSinkId is not available.
   */
  async start(outputDevice?: MediaDeviceInfo): Promise<void> {
    if (this.running) return;

    try {
      // Create a fresh AudioContext each time (allows switching output devices)
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });

      // Route to the selected device if the browser supports setSinkId
      if (outputDevice && 'setSinkId' in this.audioContext) {
        try {
          // setSinkId is a draft API — cast through unknown to satisfy TS
          await (this.audioContext as unknown as { setSinkId(id: string): Promise<void> })
            .setSinkId(outputDevice.deviceId);
        } catch (sinkErr) {
          console.warn('[LTCGenerator] setSinkId failed, using default output:', sinkErr);
        }
      }

      // Gain node so we can control level and provide a clean teardown point
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      this.gainNode.connect(this.audioContext.destination);

      this.running = true;
      this.nextScheduledTime = this.audioContext.currentTime + 0.05; // small startup buffer

      // Kick off the scheduling loop
      this.scheduleFrames();
    } catch (err) {
      this.running = false;
      const error = err instanceof Error ? err : new Error(String(err));
      this.onError?.(error);
      throw error;
    }
  }

  stop(): void {
    this.running = false;
    if (this.scheduleTimer !== null) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => { /* ignore */ });
      this.audioContext = null;
    }
  }

  /**
   * The main scheduling loop.
   * Pre-renders audio BufferSourceNodes ahead of the playhead to avoid
   * glitches. Uses setTimeout to re-fire itself before the buffer runs out.
   */
  private scheduleFrames(): void {
    if (!this.running || !this.audioContext || !this.gainNode) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Schedule ahead until we have SCHEDULE_AHEAD_TIME seconds buffered
    while (this.nextScheduledTime < now + this.SCHEDULE_AHEAD_TIME) {
      this.scheduleOneFrame(ctx);
    }

    // Fire again in SCHEDULE_AHEAD_TIME / 2 to maintain the buffer
    const rescheduleIn = (this.SCHEDULE_AHEAD_TIME / 2) * 1000;
    this.scheduleTimer = setTimeout(() => this.scheduleFrames(), rescheduleIn);
  }

  private scheduleOneFrame(ctx: AudioContext): void {
    const tc = frameNumberToTimecode(this.currentFrameNumber, this.frameRate);
    const frameData = buildLTCFrame(tc, this.frameRate);

    // Calculate exact sample count for this frame (handles fractional rates)
    const spf = samplesPerFrame(this.frameRate, this.sampleRate);
    const numSamples = Math.round(spf);

    const { samples, exitPolarity } = renderLTCFrame(frameData, numSamples, this.polarity);
    this.polarity = exitPolarity;

    // Create an AudioBuffer and schedule it
    const buffer = ctx.createBuffer(1, numSamples, this.sampleRate);
    // Use getChannelData + set() to avoid Float32Array generic variance issues
    // that arise with copyToChannel in strict TS 5.x
    buffer.getChannelData(0).set(samples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode!);
    source.start(this.nextScheduledTime);

    // Notify listener on each new frame (approximate — fires slightly ahead of real time)
    const frameDuration = numSamples / this.sampleRate;

    // Schedule the onFrame callback to fire near when this audio actually plays
    const timeUntilFrame = Math.max(0, (this.nextScheduledTime - ctx.currentTime) * 1000);
    setTimeout(() => {
      if (this.running) {
        this.onFrame?.(tc);
      }
    }, timeUntilFrame);

    this.nextScheduledTime += frameDuration;
    this.currentFrameNumber++;
  }
}

declare module 'soundtouchjs' {
  export class PitchShifter {
    constructor(context: AudioContext, buffer: AudioBuffer, bufferSize: number);
    pitch: number;
    tempo: number;
    pitchSemitones: number;
    connect(node: AudioNode): void;
    disconnect(): void;
    on(event: string, callback: (data: any) => void): void;
    off(): void;
  }
  export class SoundTouch {
    constructor(sampleRate?: number);
    pitchSemitones: number;
    tempo: number;
    rate: number;
  }
  export class SimpleFilter {
    constructor(source: any, soundTouch: any);
    extract(target: Float32Array, numFrames: number): number;
  }
  export class WebAudioBufferSource {
    constructor(buffer: AudioBuffer);
  }
}

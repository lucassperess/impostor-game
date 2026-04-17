import { useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";
import { BASS, MELODY } from "../data/audio";

export function useMusic() {
  const synthRef = useRef(null);
  const bassRef = useRef(null);
  const seqRef = useRef(null);
  const bassSeqRef = useRef(null);
  const startedRef = useRef(false);
  const mutedRef = useRef(false);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    try {
      await Tone.start();
    } catch (e) {
      return;
    }

    startedRef.current = true;
    const s = new Tone.Synth({ oscillator:{type:"square"}, envelope:{attack:0.01,decay:0.1,sustain:0.3,release:0.1}, volume:-14 }).toDestination();
    const b = new Tone.Synth({ oscillator:{type:"triangle"}, envelope:{attack:0.01,decay:0.2,sustain:0.4,release:0.2}, volume:-20 }).toDestination();
    synthRef.current = s;
    bassRef.current = b;

    let mi = 0;
    seqRef.current = new Tone.Loop((time) => {
      const [note,dur] = MELODY[mi % MELODY.length];
      s.triggerAttackRelease(note, dur, time);
      mi++;
    }, "8n").start(0);

    let bi = 0;
    bassSeqRef.current = new Tone.Loop((time) => {
      b.triggerAttackRelease(BASS[bi % BASS.length], "4n", time);
      bi++;
    }, "4n").start(0);

    Tone.Transport.bpm.value = 130;
    Tone.Transport.start();
    if (mutedRef.current) Tone.Destination.volume.value = -Infinity;
  }, []);

  const stop = useCallback(() => {
    if (!startedRef.current) return;
    Tone.Transport.stop();
    seqRef.current?.stop(); seqRef.current?.dispose(); seqRef.current = null;
    bassSeqRef.current?.stop(); bassSeqRef.current?.dispose(); bassSeqRef.current = null;
    synthRef.current?.dispose(); synthRef.current = null;
    bassRef.current?.dispose(); bassRef.current = null;
    startedRef.current = false;
  }, []);

  const toggleMute = useCallback((muted) => {
    mutedRef.current = muted;
    try { Tone.Destination.volume.value = muted ? -Infinity : 0; } catch (e) {}
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, toggleMute };
}

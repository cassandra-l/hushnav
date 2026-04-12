import { useState, useRef, useEffect } from "react";

export const useAudioMonitor = () => {
  const [volume, setVolume] = useState(0);
  // Controls the visibility of the VolumeBar and the state of the MicButton
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Refs for the 'Audio Engine' parts to store data across renders without triggering unnecessary UI refreshes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Starts microphone and audio analysis
  const startMonitoring = async () => {
    try {
      // Request browser permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio Processor Setup
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      // Settings for the analyzer
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      // Update state to trigger UI changes
      setIsMonitoring(true);
      // Loop totrack volume
      updateVolume();
    } catch (err) {
      console.error("Microphone access failed:", err);
    }
  };
  // Captures current audio frequency data and calculates the volume level
  const updateVolume = () => {
    if (!analyserRef.current) return;

    // Array to hold frequency data
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculation (RMS)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // Map the raw value to a 0-100 scale
    const normalizedVolume = Math.min(100, Math.round((rms / 128) * 100));

    setVolume(normalizedVolume);

    animationFrameRef.current = requestAnimationFrame(updateVolume);
  };

  const stopMonitoring = () => {
    // Stop the animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Close the Audio Context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }

    // Turn off the actual Microphone tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Change 'X' icon back to 'Mic' icon
    setIsMonitoring(false);
    setVolume(0);
  };

  // Stop microphone if user switch to another page without clicking the 'X' button
  useEffect(() => {
    return () => stopMonitoring();
  }, []);

  return { volume, isMonitoring, startMonitoring, stopMonitoring };
};

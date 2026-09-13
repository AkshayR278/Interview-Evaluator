import { useCallback, useRef, useState } from "react";

/**
 * Wraps the browser's MediaRecorder API for recording short voice answers.
 * Exposes a simple state machine: "idle" -> "recording" -> "stopped".
 * On stop, produces a single audio Blob the caller can upload.
 */
export function useAudioRecorder() {
  const [status, setStatus] = useState("idle"); // idle | recording | stopped
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        // Release the mic so the browser's "recording" indicator turns off.
        streamRef.current?.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setStatus("recording");
    } catch (err) {
      // Most common cause: user denied mic permission.
      setError(
        "Couldn't access your microphone. Check browser permissions and try again."
      );
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      setStatus("stopped");
    }
  }, [status]);

  const reset = useCallback(() => {
    setStatus("idle");
    setAudioBlob(null);
    setError(null);
    chunksRef.current = [];
  }, []);

  return { status, audioBlob, error, startRecording, stopRecording, reset };
}

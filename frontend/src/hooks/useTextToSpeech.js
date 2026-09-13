import { useCallback, useEffect, useState } from "react";

/**
 * Wraps the browser-native SpeechSynthesis API.
 * We use this instead of a server-side TTS call because the "external API
 * integration" story is already earned via Deepgram STT on the backend --
 * no need to pay for/manage a second TTS service just to read a question aloud.
 */
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // If the user navigates away mid-speech, stop it rather than let it run on.
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text) => {
    // Cancel anything already queued/playing before starting new speech.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}

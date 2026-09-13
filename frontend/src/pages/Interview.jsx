import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

function Interview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const recorder = useAudioRecorder();

  // These come from Home.jsx via navigate("/interview", { state: {...} }).
  // If someone lands here directly (e.g. a page refresh), state is null --
  // we handle that below rather than crashing.
  const { interviewId, questions } = location.state || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerMode, setAnswerMode] = useState("type"); // "type" | "record"
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!interviewId || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-medium mb-2">
            No interview in progress
          </h1>
          <p className="text-ink/70 mb-6">
            Start a new practice interview from the home screen.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="bg-accent text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Shared by all response paths: once a response is saved,
  // either move to the next question or, on the last one,
  // mark the interview complete and head to the results screen.
  async function advanceOrFinish() {
    if (isLastQuestion) {
      await apiClient.post(`/interviews/${interviewId}/complete`);
      navigate("/results", { state: { interviewId } });
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswerText("");
      recorder.reset();
    }
  }

  function handleAlreadyAnswered() {
    setError("This question was already answered. Moving on.");
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
    setAnswerText("");
    recorder.reset();
  }

  async function handleSubmitTyped(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    stop();

    try {
      await apiClient.post("/responses", {
        question_id: currentQuestion.id,
        answer: answerText,
      });

      await advanceOrFinish();
    } catch (err) {
      if (err.response?.status === 409) {
        handleAlreadyAnswered();
      } else {
        setError("Couldn't submit that answer. Try again.");
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitRecording() {
    if (!recorder.audioBlob) return;

    setError(null);
    setIsSubmitting(true);
    stop();

    const formData = new FormData();

    // Filename matters less than the field name matching what FastAPI
    // expects: `audio_file`, since that's the UploadFile parameter name.
    formData.append("audio_file", recorder.audioBlob, "answer.webm");

    try {
      await apiClient.post("/responses/transcribe", formData, {
        params: { question_id: currentQuestion.id },
        headers: { "Content-Type": "multipart/form-data" },
      });

      // /responses/transcribe already creates the Response row.
      await advanceOrFinish();
    } catch (err) {
      if (err.response?.status === 409) {
        handleAlreadyAnswered();
      } else if (err.response?.status === 502) {
        setError("Transcription failed. Try recording your answer again.");
      } else {
        setError("Couldn't submit that recording. Try again.");
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setIsSubmitting(true);
    stop();

    try {
      await apiClient.post("/responses/skipped", null, {
        params: { question_id: currentQuestion.id },
      });

      await advanceOrFinish();
    } catch (err) {
      if (err.response?.status === 409) {
        handleAlreadyAnswered();
      } else {
        setError("Couldn't skip this question. Try again.");
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(mode) {
    setAnswerMode(mode);
    setError(null);
    recorder.reset();
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 sm:px-12">
      <div className="max-w-xl w-full mx-auto">
        {/* Progress: a thin line rather than numbered step circles */}
        <div className="mb-8">
          <p className="text-sm text-ink/60 mb-2">
            Question {currentIndex + 1} of {questions.length}
          </p>

          <div className="h-px bg-line relative">
            <div
              className="h-px bg-accent absolute top-0 left-0 transition-all"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-medium leading-snug">
            {currentQuestion.question}
          </h1>

          <button
            type="button"
            onClick={() =>
              isSpeaking
                ? stop()
                : speak(currentQuestion.question)
            }
            className="shrink-0 border border-line rounded-sm px-3 py-2 text-sm text-ink/70 hover:bg-surface transition-colors"
          >
            {isSpeaking ? "Stop" : "Play"}
          </button>
        </div>

        {/* Mode toggle: type vs record */}
        <div className="flex gap-1 mb-4 text-sm">
          <button
            type="button"
            onClick={() => switchMode("type")}
            className={`px-3 py-1.5 rounded-sm transition-colors ${
              answerMode === "type"
                ? "bg-ink text-white"
                : "text-ink/60 hover:bg-surface"
            }`}
          >
            Type answer
          </button>

          <button
            type="button"
            onClick={() => switchMode("record")}
            className={`px-3 py-1.5 rounded-sm transition-colors ${
              answerMode === "record"
                ? "bg-ink text-white"
                : "text-ink/60 hover:bg-surface"
            }`}
          >
            Record answer
          </button>
        </div>

        {answerMode === "type" ? (
          <form onSubmit={handleSubmitTyped}>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              required
              rows={8}
              placeholder="Type your answer..."
              className="w-full border border-line bg-surface px-4 py-3 rounded-sm text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />

            {error && (
              <p className="text-sm text-accent-warm mt-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 bg-accent text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {isSubmitting
                ? "Submitting..."
                : isLastQuestion
                ? "Finish interview"
                : "Next question"}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="mt-3 block text-sm text-ink/60 hover:text-ink underline disabled:opacity-40"
            >
              Skip question
            </button>
          </form>
        ) : (
          <div>
            <div className="border border-line bg-surface rounded-sm px-4 py-10 flex flex-col items-center justify-center gap-4">
              {recorder.status === "idle" && (
                <button
                  type="button"
                  onClick={recorder.startRecording}
                  className="w-16 h-16 rounded-full bg-accent-warm text-white flex items-center justify-center hover:bg-accent-warm/90 transition-colors"
                  aria-label="Start recording"
                >
                  <span className="w-4 h-4 rounded-full bg-white" />
                </button>
              )}

              {recorder.status === "recording" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-accent-warm/20 flex items-center justify-center animate-pulse">
                    <span className="w-3 h-3 rounded-full bg-accent-warm" />
                  </div>

                  <button
                    type="button"
                    onClick={recorder.stopRecording}
                    className="border border-line rounded-sm px-4 py-2 text-sm hover:bg-canvas transition-colors"
                  >
                    Stop recording
                  </button>
                </>
              )}

              {recorder.status === "stopped" &&
                recorder.audioBlob && (
                  <div className="w-full flex flex-col items-center gap-3">
                    <audio
                      controls
                      src={URL.createObjectURL(recorder.audioBlob)}
                      className="w-full max-w-xs"
                    />

                    <button
                      type="button"
                      onClick={recorder.reset}
                      className="text-sm text-ink/60 hover:text-ink underline"
                    >
                      Re-record
                    </button>
                  </div>
                )}
            </div>

            {recorder.error && (
              <p className="text-sm text-accent-warm mt-3">
                {recorder.error}
              </p>
            )}

            {error && (
              <p className="text-sm text-accent-warm mt-3">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmitRecording}
              disabled={
                recorder.status !== "stopped" || isSubmitting
              }
              className="mt-4 bg-accent text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              {isSubmitting
                ? "Uploading..."
                : isLastQuestion
                ? "Finish interview"
                : "Next question"}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="mt-3 block text-sm text-ink/60 hover:text-ink underline disabled:opacity-40"
            >
              Skip question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;
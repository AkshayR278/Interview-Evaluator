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
        <div className="panel-card max-w-md p-8 text-center">
          <h1 className="text-2xl font-medium mb-2">No interview in progress</h1>
          <p className="muted-copy mb-6">
            Start a new practice interview from the home screen.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="primary-button"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Shared by both the typed-answer and recorded-answer paths: once a
  // response is saved, either move to the next question or, on the last
  // one, mark the interview complete and head to the results screen.
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
    stop(); // stop any TTS still playing when the user submits

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
      const { data: savedResponse } = await apiClient.post(
        "/responses/transcribe",
        formData,
        {
          params: { question_id: currentQuestion.id },
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Deepgram can return a 200 with an empty transcript if it didn't
      // pick up any speech (too quiet, mic issue, stopped too early).
      // The backend already saved that blank Response row, so a retry
      // would otherwise hit the "already answered" 409 check -- delete
      // it first so the person can genuinely try again.
      if (!savedResponse.answer || !savedResponse.answer.trim()) {
        await apiClient.delete(`/responses/${savedResponse.id}`);
        setError(
          "We didn't catch any speech in that recording. Try again, speaking a bit louder."
        );
        recorder.reset();
        return;
      }

      // Note: unlike the typed path, /responses/transcribe already saves
      // the Response row itself -- there's no separate POST /responses call.
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
        setError("Couldn't skip that question. Try again.");
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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 sm:px-10">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">i</span>
          <span>Interview Practice</span>
        </div>
        <span className="muted-copy text-sm">Practice session</span>
      </header>

      <div className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="eyebrow">
            <span className="eyebrow-highlight">Question {currentIndex + 1}</span>{" "}
            <span className="muted-copy">/ {questions.length}</span>
          </p>
          <span className="muted-copy text-xs">
            {Math.round(((currentIndex + 1) / questions.length) * 100)}% complete
          </span>
        </div>
        <div
          className="progress-track mb-8"
          role="progressbar"
          aria-label="Interview progress"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={currentIndex + 1}
        >
          <div
            className="progress-fill"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <section className="panel-card p-5 sm:p-9">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Take a moment to think</p>
              <h1 className="text-2xl font-medium leading-snug sm:text-3xl">
                {currentQuestion.question}
              </h1>
            </div>
            <button
              type="button"
              onClick={() =>
                isSpeaking ? stop() : speak(currentQuestion.question)
              }
              className="secondary-button min-h-0 shrink-0 px-3 py-2 text-sm"
              aria-label={isSpeaking ? "Stop reading question" : "Read question aloud"}
            >
              {isSpeaking ? "Stop audio" : "Read aloud"}
            </button>
          </div>

          <div
            className="mb-4 inline-flex border border-line bg-surface text-sm"
            role="group"
            aria-label="Choose answer method"
          >
            <button
              type="button"
              onClick={() => switchMode("type")}
              aria-pressed={answerMode === "type"}
              className="mode-button border-r border-line px-4 py-2 transition-colors"
            >
              Type answer
            </button>
            <button
              type="button"
              onClick={() => switchMode("record")}
              aria-pressed={answerMode === "record"}
              className="mode-button px-4 py-2 transition-colors"
            >
              Record answer
            </button>
          </div>

          {answerMode === "type" ? (
            <form onSubmit={handleSubmitTyped} className="space-y-4">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              required
              rows={8}
              placeholder="Type your answer..."
              aria-label="Your answer"
              className="app-textarea min-h-52 resize-y px-4 py-3 text-sm leading-relaxed"
            />

            {error && <p role="alert" className="text-sm text-accent-warm">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-button"
            >
              {isSubmitting
                ? "Submitting..."
                : isLastQuestion
                ? "Finish interview"
                : "Next question"}
            </button>
            </form>
          ) : (
            <div>
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 border border-dotted border-ink bg-surface px-4 py-10">
              <p className="muted-copy text-sm">
                {recorder.status === "recording"
                  ? "Recording your answer..."
                  : recorder.status === "stopped"
                  ? "Listen back before submitting"
                  : "When you're ready, record your answer"}
              </p>
              {recorder.status === "idle" && (
                <button
                  type="button"
                  onClick={recorder.startRecording}
                  className="flex h-16 w-16 items-center justify-center border border-ink bg-accent text-ink transition-colors hover:bg-white"
                  aria-label="Start recording"
                >
                  <span className="h-4 w-4 bg-ink" />
                </button>
              )}

              {recorder.status === "recording" && (
                <>
                  <div className="flex h-16 w-16 animate-pulse items-center justify-center border border-ink bg-accent">
                    <span className="h-3 w-3 bg-ink" />
                  </div>
                  <button
                    type="button"
                    onClick={recorder.stopRecording}
                    className="secondary-button"
                  >
                    Stop recording
                  </button>
                </>
              )}

              {recorder.status === "stopped" && recorder.audioBlob && (
                <div className="flex w-full flex-col items-center gap-3">
                  <audio
                    controls
                    src={URL.createObjectURL(recorder.audioBlob)}
                    className="w-full max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={recorder.reset}
                    className="text-sm text-accent underline underline-offset-4 hover:text-ink"
                  >
                    Re-record
                  </button>
                  </div>
                )}
            </div>

            {recorder.error && (
              <p role="alert" className="mt-3 text-sm text-accent-warm">{recorder.error}</p>
            )}
            {error && <p role="alert" className="mt-3 text-sm text-accent-warm">{error}</p>}

            <button
              type="button"
              onClick={handleSubmitRecording}
              disabled={recorder.status !== "stopped" || isSubmitting}
              className="primary-button mt-4"
            >
              {isSubmitting
                ? "Uploading..."
                : isLastQuestion
                ? "Finish interview"
                : "Next question"}
            </button>
          </div>
        )}

          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="mt-5 block text-sm text-ink/50 underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-40"
          >
            Skip this question
          </button>
        </section>
      </div>
    </main>
  );
}

export default Interview;

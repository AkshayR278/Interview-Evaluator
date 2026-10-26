import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";

const BAND_CLASSES = {
  success: { text: "text-success", bg: "bg-success" },
  neutral: { text: "text-ink", bg: "bg-ink" },
  low: { text: "text-accent-warm", bg: "bg-accent-warm" },
};

function scoreBand(score) {
  if (score >= 76) return "success";
  if (score >= 51) return "neutral";
  return "low";
}

function ScoreDisplay({ score }) {
  const band = BAND_CLASSES[scoreBand(score)];

  return (
    <div className="score-poster" aria-label={`${score} out of 100`}>
      <span className="eyebrow">Session score</span>
      <div className={`score-poster-number ${band.text}`}>
        {String(score).padStart(2, "0")}
      </div>
      <span className="editorial-label">/ 100</span>
    </div>
  );
}

function ScoreMeter({ label, score }) {
  const band = BAND_CLASSES[scoreBand(score)];
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-ink/50 w-20 shrink-0">{label}</span>
      <div className="score-track flex-1 overflow-hidden">
        <div
          className={`score-track-fill ${band.bg} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="font-mono text-xs text-ink/60 w-8 text-right">
        {score}
      </span>
    </div>
  );
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId } = location.state || {};

  const [totalScore, setTotalScore] = useState(null);
  const [breakdown, setBreakdown] = useState([]); // [{ question, answer, evaluation }]
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState(null);

  // Guards against React 18 StrictMode firing this effect twice in dev,
  // which would otherwise fire generate-evaluation twice and hit the
  // backend's 409 "already exists" check on the second call.
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!interviewId || hasRunRef.current) return;
    hasRunRef.current = true;

    async function loadResults() {
      try {
        // 1. Generate (or confirm) the overall interview result.
        try {
          const { data: result } = await apiClient.post(
            `/interview/${interviewId}/generate-evaluation`
          );
          setTotalScore(result.total_score);
        } catch (err) {
          if (err.response?.status === 409) {
            // Results already existed from a previous visit to this page.
            // We don't have a dedicated "fetch existing result" endpoint,
            // so we proceed without the total score rather than block
            // the per-question breakdown below.
            setTotalScore(null);
          } else {
            throw err;
          }
        }

        // 2. Pull everything needed to build a per-question breakdown.
        const [questionsRes, responsesRes, evaluationsRes] = await Promise.all([
          apiClient.get("/questions"),
          apiClient.get("/responses"),
          apiClient.get("/evaluations"),
        ]);

        const questionsForInterview = questionsRes.data.filter(
          (q) => q.interview_id === interviewId
        );

        const joined = questionsForInterview.map((question) => {
          const response = responsesRes.data.find(
            (r) => r.question_id === question.id
          );
          const evaluation = response
            ? evaluationsRes.data.find((e) => e.response_id === response.id)
            : null;
          return { question, response, evaluation };
        });

        setBreakdown(joined);
        setStatus("ready");
      } catch (err) {
        console.error(err);
        setErrorMessage(
          err.response?.status === 409
            ? "This interview hasn't been completed yet."
            : "Couldn't load your results. Try again."
        );
        setStatus("error");
      }
    }

    loadResults();
  }, [interviewId]);

  if (!interviewId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="panel-card max-w-md p-8 text-center">
          <h1 className="text-2xl font-medium mb-2">No results to show</h1>
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

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="panel-card max-w-md p-8 text-center" role="status">
          <div className="editorial-loader mx-auto mb-5 h-10 w-10 animate-spin border-2 border-line border-t-ink" />
          <p className="eyebrow">Your practice report</p>
          <h1 className="mt-2 text-2xl font-medium">Reviewing your answers</h1>
          <p className="muted-copy mt-2 text-sm">This can take a few moments.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="panel-card max-w-md p-8 text-center">
          <p role="alert" className="mb-4 text-accent-warm">{errorMessage}</p>
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8 sm:px-10 sm:py-12">
      <header className="app-header mb-10">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">i</span>
          <span>Interview Practice</span>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="secondary-button min-h-0 px-4 py-2 text-sm"
        >
          Back to home
        </button>
      </header>

      <div className="mb-8">
        <p className="eyebrow"><span className="eyebrow-highlight">Interview complete</span></p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
          Your practice report
        </h1>
        <p className="muted-copy mt-2">A clear look at what went well and what to build on.</p>
      </div>

      <section className="panel-card mb-10 flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
        {totalScore !== null ? (
          <>
            <ScoreDisplay score={totalScore} />
            <div className="text-center sm:text-left">
              <p className="eyebrow">Overall score</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {totalScore >= 76
                  ? "Strong performance"
                  : totalScore >= 51
                  ? "Good foundation"
                  : "Room to grow"}
              </h2>
              <p className="muted-copy mt-2 max-w-md text-sm leading-6">
                Use this score as a snapshot of this session, then focus on the
                feedback below to improve your next attempt.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center sm:text-left">
            <p className="eyebrow">Evaluation summary</p>
            <h2 className="mt-2 text-2xl font-semibold">Here&apos;s your breakdown</h2>
            <p className="muted-copy mt-2 text-sm">
              The overall score is unavailable, but you can still review each answer.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="answer-review-title">
        <div className="mb-5">
          <p className="eyebrow">Answer by answer</p>
          <h2 id="answer-review-title" className="mt-1 text-2xl font-medium">
            Detailed feedback
          </h2>
        </div>
        <div className="space-y-4">
          {breakdown.map(({ question, response, evaluation }, i) => (
            <article key={question.id} className="panel-card p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="eyebrow">Question {i + 1}</p>
                {!response?.answer && (
                  <span className="border border-dotted border-ink px-3 py-1 font-mono text-xs text-ink/50">
                    Not answered
                  </span>
                )}
              </div>
              <h3 className="mb-4 text-lg font-medium leading-snug">{question.question}</h3>

              {response ? (
                <p className="muted-copy mb-5 whitespace-pre-wrap text-sm leading-relaxed">
                  {response.answer}
                </p>
              ) : (
                <p className="muted-copy mb-5 text-sm italic">Not answered</p>
              )}

              {evaluation ? (
                <>
                  <div className="mb-5 grid max-w-xl gap-x-8 gap-y-3 sm:grid-cols-2">
                    <ScoreMeter label="Accuracy" score={evaluation.accuracy_score} />
                    <ScoreMeter label="Relevance" score={evaluation.relevance_score} />
                    <ScoreMeter label="Technical" score={evaluation.technical_score} />
                    <ScoreMeter label="Grammar" score={evaluation.grammar_score} />
                    <ScoreMeter label="Confidence" score={evaluation.confidence_score} />
                  </div>
                  <p className="text-sm leading-relaxed text-ink/85">
                    {evaluation.feedback}
                  </p>
                  {evaluation.strengths && (
                    <p className="status-note mt-3 border border-success/15 text-sm leading-relaxed text-success">
                      <span className="font-semibold">Strengths: </span>
                      {evaluation.strengths}
                    </p>
                  )}
                </>
              ) : (
                <p className="muted-copy text-sm italic">
                  No evaluation available for this question.
                </p>
              )}
            </article>
          ))}
        </div>

        <button
          onClick={() => navigate("/home")}
          className="primary-button mt-8"
        >
          Start another practice
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
}

export default Results;

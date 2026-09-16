import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";

// Shared score-band -> color mapping, used by both the big radial score
// and each per-question sub-score meter, so the same visual language
// (rose = low, warm off-white = mid, sage = high) means the same thing
// everywhere on this page. Matches the calibrated band anchors from the
// evaluation rubric: 0-20 / 21-50 / 51-75 / 76-100 (the bottom two bands
// share a color here since both represent "needs real work").
const BAND_CLASSES = {
  success: { text: "text-success", stroke: "stroke-success", bg: "bg-success" },
  neutral: { text: "text-ink", stroke: "stroke-ink", bg: "bg-ink" },
  low: { text: "text-accent-warm", stroke: "stroke-accent-warm", bg: "bg-accent-warm" },
};

function scoreBand(score) {
  if (score >= 76) return "success";
  if (score >= 51) return "neutral";
  return "low";
}

// The one bold visual moment on this page: a radial ring showing the
// total score, with the actual digits set in monospace since they're
// data, not prose.
function ScoreRing({ score }) {
  const size = 148;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const band = BAND_CLASSES[scoreBand(score)];

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-line"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${band.stroke} transition-all duration-700 ease-out`}
          fill="none"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-mono text-4xl font-semibold ${band.text}`}>
          {score}
        </span>
        <span className="text-xs text-ink/40">out of 100</span>
      </div>
    </div>
  );
}

// A single sub-score row: label, a thin horizontal track, and the
// numeric value in monospace at the end.
function ScoreMeter({ label, score }) {
  const band = BAND_CLASSES[scoreBand(score)];
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-ink/50 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
        <div
          className={`h-full rounded-full ${band.bg} transition-all duration-500 ease-out`}
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
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-medium mb-2">No results to show</h1>
          <p className="text-ink/70 mb-6">
            Start a new practice interview from the home screen.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="bg-accent text-on-accent px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-ink/60">Scoring your interview...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-accent-warm mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate("/home")}
            className="bg-accent text-on-accent px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 sm:px-12 py-16">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm tracking-wide text-ink/60 mb-6">
          Interview complete
        </p>

        {totalScore !== null ? (
          <div className="mb-12">
            <ScoreRing score={totalScore} />
          </div>
        ) : (
          <h1 className="text-2xl font-medium mb-12">Here's your breakdown</h1>
        )}

        <div className="space-y-10">
          {breakdown.map(({ question, response, evaluation }, i) => (
            <div key={question.id} className="border-t border-line pt-6">
              <p className="text-sm text-ink/50 mb-1">Question {i + 1}</p>
              <h2 className="text-lg font-medium mb-3">{question.question}</h2>

              {response ? (
                <p className="text-sm text-ink/70 mb-5 leading-relaxed">
                  {response.answer}
                </p>
              ) : (
                <p className="text-sm text-ink/40 italic mb-5">Not answered</p>
              )}

              {evaluation ? (
                <>
                  <div className="space-y-2 mb-4 max-w-xs">
                    <ScoreMeter label="Accuracy" score={evaluation.accuracy_score} />
                    <ScoreMeter label="Relevance" score={evaluation.relevance_score} />
                    <ScoreMeter label="Technical" score={evaluation.technical_score} />
                    <ScoreMeter label="Grammar" score={evaluation.grammar_score} />
                    <ScoreMeter label="Confidence" score={evaluation.confidence_score} />
                  </div>
                  <p className="text-sm text-ink/80 leading-relaxed mb-2">
                    {evaluation.feedback}
                  </p>
                  {evaluation.strengths && (
                    <p className="text-sm text-success">
                      {evaluation.strengths}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink/40 italic">
                  No evaluation available for this question.
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/home")}
          className="mt-12 border border-line rounded-sm px-6 py-3 text-sm font-medium hover:bg-surface transition-colors"
        >
          Start another practice interview
        </button>
      </div>
    </div>
  );
}

export default Results;

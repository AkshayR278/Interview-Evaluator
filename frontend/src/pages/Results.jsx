import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";

function scoreTone(score) {
  // Matches the calibrated band anchors: 0-20 / 21-50 / 51-75 / 76-100
  if (score >= 76) return "text-success";
  if (score >= 51) return "text-ink";
  if (score >= 21) return "text-accent-warm";
  return "text-accent-warm";
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
            className="bg-accent text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors"
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
            className="bg-accent text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors"
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
        <p className="text-sm tracking-wide text-ink/60 mb-2">
          Interview complete
        </p>

        {totalScore !== null ? (
          <h1 className={`text-5xl font-medium mb-10 ${scoreTone(totalScore)}`}>
            {totalScore}
            <span className="text-2xl text-ink/50">/100</span>
          </h1>
        ) : (
          <h1 className="text-2xl font-medium mb-10">Here's your breakdown</h1>
        )}

        <div className="space-y-8">
          {breakdown.map(({ question, response, evaluation }, i) => (
            <div key={question.id} className="border-t border-line pt-6">
              <p className="text-sm text-ink/50 mb-1">Question {i + 1}</p>
              <h2 className="text-lg font-medium mb-3">{question.question}</h2>

              {response ? (
                <p className="text-sm text-ink/70 mb-4 leading-relaxed">
                  {response.answer}
                </p>
              ) : (
                <p className="text-sm text-ink/40 italic mb-4">Not answered</p>
              )}

              {evaluation ? (
                <>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink/60 mb-3">
                    <span>Accuracy: {evaluation.accuracy_score}</span>
                    <span>Relevance: {evaluation.relevance_score}</span>
                    <span>Technical: {evaluation.technical_score}</span>
                    <span>Grammar: {evaluation.grammar_score}</span>
                    <span>Confidence: {evaluation.confidence_score}</span>
                  </div>
                  <p className="text-sm leading-relaxed mb-2">
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

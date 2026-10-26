import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";

function Home() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);

  async function handleStart(event) {
    event.preventDefault();
    setError(null);

    const candidateId = localStorage.getItem("candidateId");
    if (!candidateId) {
      navigate("/");
      return;
    }

    setIsStarting(true);

    try {
      // 1. Create the interview record.
      const { data: interview } = await apiClient.post("/interviews", {
        candidate_id: Number(candidateId),
        company,
        role,
      });

      // 2. Ask the backend (Gemini) to generate questions for it.
      const { data: questions } = await apiClient.post(
        `/interviews/${interview.id}/generate-questions`,
        null,
        { params: { count: Number(questionCount) } }
      );

      // 3. Hand off to the interview screen with everything it needs.
      navigate("/interview", {
        state: { interviewId: interview.id, questions },
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Your account couldn't be found. Try logging in again.");
      } else {
        setError("Something went wrong starting the interview. Try again.");
      }
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("candidateId");
    navigate("/");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 sm:px-10">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">i</span>
          <span>Interview Practice</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="secondary-button min-h-0 px-4 py-2 text-sm"
        >
          Log out
        </button>
      </header>

      <section className="home-layout grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
        <div>
          <p className="eyebrow mb-5"><span className="eyebrow-highlight">Field notes · 01</span></p>
          <h1 className="mb-6 max-w-xl text-5xl font-medium leading-none tracking-tight sm:text-7xl">
            The interview is a conversation.
          </h1>
          <p className="muted-copy max-w-lg text-base leading-7 sm:text-lg">
            Rehearse the hard parts before they happen. Set the scene, choose
            your pace, and leave with useful notes — not just a number.
          </p>

          <div className="editorial-grid mt-10 max-w-lg">
            <div className="editorial-cell">
              <p className="editorial-value">
                {questionCount.padStart(2, "0")}
              </p>
              <p className="editorial-label">questions in this session</p>
            </div>
            <div className="editorial-cell">
              <p className="editorial-value">02</p>
              <p className="editorial-label">ways to answer</p>
            </div>
            <div className="editorial-cell">
              <p className="editorial-value">01</p>
              <p className="editorial-label">personal report</p>
            </div>
          </div>
        </div>

        <section className="panel-card p-6 sm:p-8" aria-labelledby="start-title">
          <p className="eyebrow"><span className="eyebrow-highlight">Set up your session</span></p>
          <h2 id="start-title" className="mt-3 text-3xl font-medium leading-tight tracking-tight">
            Choose your next conversation.
          </h2>
          <p className="muted-copy mt-2 text-sm leading-6">
            Add a target role and company to tailor your questions.
          </p>

          <form onSubmit={handleStart} className="mt-7 space-y-5">
            <div className="auth-field">
              <label htmlFor="role">Target role</label>
              <input
                id="role"
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="company">Company or industry</label>
              <input
                id="company"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. a fintech startup"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="question-count">Question count</label>
              <input
                id="question-count"
                type="number"
                min="1"
                max="20"
                required
                value={questionCount}
                onChange={(event) => setQuestionCount(event.target.value)}
                aria-describedby="question-count-help"
              />
              <span id="question-count-help" className="muted-copy text-xs">
                Choose between 1 and 20 questions.
              </span>
            </div>

            {error && <p role="alert" className="text-sm text-accent-warm">{error}</p>}

            <button
              type="submit"
              disabled={isStarting}
              className="primary-button w-full"
            >
              {isStarting ? "Preparing your questions..." : "Start practice"}
              {!isStarting && <span aria-hidden="true">→</span>}
            </button>
          </form>
          <p className="muted-copy mt-4 text-xs">
            Make a quick set or build a longer rehearsal — you choose the length.
          </p>
        </section>
      </section>
    </main>
  );
}

export default Home;

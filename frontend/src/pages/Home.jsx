import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";

function Home() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
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
        `/interviews/${interview.id}/generate-questions`
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
    <div className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12">
      <button
        type="button"
        onClick={handleLogout}
        className="absolute top-6 right-6 sm:top-8 sm:right-12 text-sm text-ink/50 hover:text-ink transition-colors"
      >
        Log out
      </button>

      <div className="max-w-xl">
        <p className="text-sm tracking-wide text-ink/60 mb-4">
          Practice interview
        </p>
        <h1 className="text-4xl sm:text-5xl font-medium leading-tight mb-6">
          Talk through the questions
          <br />
          you're afraid they'll ask.
        </h1>
        <p className="text-base text-ink/70 leading-relaxed mb-10 max-w-md">
          A short mock technical interview, generated for the role
          you're preparing for. Answer by typing or speaking. Get a
          scored, honest breakdown when you're done.
        </p>

        <form onSubmit={handleStart} className="max-w-sm space-y-4">
          <div>
            <label
              htmlFor="role"
              className="block text-sm text-ink/70 mb-1"
            >
              Role you're preparing for
            </label>
            <input
              id="role"
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Backend Engineer"
              className="w-full border border-line bg-surface px-3 py-2 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm text-ink/70 mb-1"
            >
              Company
            </label>
            <input
              id="company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. a fintech startup"
              className="w-full border border-line bg-surface px-3 py-2 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-sm text-accent-warm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isStarting}
            className="inline-block bg-accent text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {isStarting ? "Preparing questions..." : "Start practice interview"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home;

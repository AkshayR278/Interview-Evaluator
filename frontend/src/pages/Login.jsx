import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justSignedUp = location.state?.justSignedUp;

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data } = await apiClient.post("/candidates/login", {
        email,
        password,
      });

      // No global auth state/context in the app yet -- localStorage is the
      // simplest thing that works for now. Home.jsx reads this instead of
      // a hardcoded candidate id.
      localStorage.setItem("candidateId", data.candidate_id);
      navigate("/home");
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 401) {
        // Backend already returns a friendly, safe message for both cases.
        setError(err.response.data.detail);
      } else {
        setError("Something went wrong logging in. Try again.");
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">i</span>
          <span>Interview Practice</span>
        </div>
        <p className="eyebrow mt-10"><span className="eyebrow-highlight">A calmer way to prepare</span></p>
        <h1>Show up ready for the real thing.</h1>
        <p className="auth-story-copy">
          Practice role-specific questions, find your strongest answers, and
          know what to work on next — before interview day.
        </p>
        <ul className="auth-feature-list" aria-label="What you can do">
          <li className="auth-feature">
            <span className="auth-feature-mark" aria-hidden="true">✓</span>
            Five focused questions tailored to your role
          </li>
          <li className="auth-feature">
            <span className="auth-feature-mark" aria-hidden="true">✓</span>
            Answer naturally with voice or text
          </li>
          <li className="auth-feature">
            <span className="auth-feature-mark" aria-hidden="true">✓</span>
            Clear feedback to guide your next practice
          </li>
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Welcome back</p>
        <h2 id="login-title">Log in</h2>
        <p className="muted-copy mb-7 text-sm">
          Pick up where your preparation begins.
        </p>

        {justSignedUp && (
          <p role="status" className="status-note mb-5 border border-success/20 text-sm text-success">
            Account created. Log in to get started.
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && <p role="alert" className="text-sm text-accent-warm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-button w-full"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="muted-copy mt-7 text-center text-sm">
          New here?{" "}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;

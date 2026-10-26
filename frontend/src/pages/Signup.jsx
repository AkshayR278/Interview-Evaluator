import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSignup(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post("/candidates", { name, email, password });

      // No auto-login endpoint yet -- send them to the login page with
      // their email prefilled and a success message, same pattern as any
      // signup-then-login flow.
      navigate("/", { state: { justSignedUp: true, email } });
    } catch (err) {
      // NOTE: the backend doesn't yet check for a duplicate email before
      // inserting, so a repeated signup may come back as a raw 500 rather
      // than a clean 409. Handle both until that's fixed server-side.
      if (err.response?.status === 409 || err.response?.status === 500) {
        setError("That email may already be registered. Try logging in instead.");
      } else {
        setError("Something went wrong creating your account. Try again.");
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
        <p className="eyebrow mt-10"><span className="eyebrow-highlight">Make every answer count</span></p>
        <h1>Build confidence one practice at a time.</h1>
        <p className="auth-story-copy">
          Set up your account and turn interview nerves into a clear plan for
          what to practice next.
        </p>
        <ul className="auth-feature-list" aria-label="Practice features">
          <li className="auth-feature">
            <span className="auth-feature-mark" aria-hidden="true">✓</span>
            Questions adapted to your target role
          </li>
          <li className="auth-feature">
            <span className="auth-feature-mark" aria-hidden="true">✓</span>
            Speak or type — practice your way
          </li>
          <li className="auth-feature">
            <span className="auth-feature-mark" aria-hidden="true">✓</span>
            Actionable feedback after every session
          </li>
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="signup-title">
        <p className="eyebrow">Get started</p>
        <h2 id="signup-title">Create your account</h2>
        <p className="muted-copy mb-7 text-sm">
          Your next interview starts with a little practice.
        </p>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="auth-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <span className="muted-copy text-xs">Use at least 8 characters.</span>
          </div>

          {error && <p role="alert" className="text-sm text-accent-warm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-button w-full"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="muted-copy mt-7 text-center text-sm">
          Already have an account?{" "}
          <Link to="/" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Signup;

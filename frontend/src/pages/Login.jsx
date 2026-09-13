import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
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
    <div className="min-h-screen flex flex-col justify-center px-6 sm:px-12">
      <div className="max-w-sm w-full mx-auto">
        <p className="text-sm tracking-wide text-ink/60 mb-4">Welcome back</p>
        <h1 className="text-3xl font-medium mb-8">Log in</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-ink/70 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line bg-surface px-3 py-2 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-ink/70 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line bg-surface px-3 py-2 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && <p className="text-sm text-accent-warm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

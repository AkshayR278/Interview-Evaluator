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
    <div className="min-h-screen flex flex-col justify-center px-6 sm:px-12">
      <div className="max-w-sm w-full mx-auto">
        <p className="text-sm tracking-wide text-ink/60 mb-4">Get started</p>
        <h1 className="text-3xl font-medium mb-8">Create your account</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-ink/70 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-line bg-surface px-3 py-2 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line bg-surface px-3 py-2 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && <p className="text-sm text-accent-warm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent text-on-accent px-6 py-3 rounded-sm text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6">
          Already have an account?{" "}
          <Link to="/" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;

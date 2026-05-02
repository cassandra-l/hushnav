import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthentication, setAuthenticatedForOneHour } from "./auth-lock";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

type LockLocationState = {
  from?: {
    pathname?: string;
  };
};

export function PasswordLockPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = location.state as LockLocationState | null;
  // go back to requested route after unlock.
  const redirectPath = state?.from?.pathname || "/";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // stop empty submit.
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // verify on server.
      const response = await fetch(`${API_BASE_URL}/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: trimmedPassword }),
      });

      if (!response.ok) {
        throw new Error("Verification request failed.");
      }

      const data = (await response.json()) as { ok?: boolean };

      // clear auth on invalid password.
      if (!data.ok) {
        clearAuthentication();
        setError("Incorrect password.");
        return;
      }

      // start new 1-hour session.
      setAuthenticatedForOneHour();
      navigate(redirectPath, { replace: true });
    } catch (submitError) {
      console.error("Password verification failed:", submitError);
      clearAuthentication();
      setError("Unable to verify password right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <h1 className="mb-2 text-2xl font-bold text-[#2D3142]">HushNav Site Locked</h1>
        <p className="mb-5 text-sm text-[#7B828A]">
          Enter password to continue. Access lasts for 1 hour.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="site-password"
              className="mb-2 block text-sm font-medium text-[#4A5565]"
            >
              Password
            </label>
            <input
              id="site-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#DCE7E3] px-4 py-3 text-sm text-[#1E2939] outline-none focus:border-[#82AF9F]"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-[#FFE9E9] px-3 py-2 text-sm text-[#B42318]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[28px] bg-[#82AF9F] py-[14px] text-base font-bold text-white transition-all hover:bg-[#749f90] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Checking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";

export function LoginForm() {
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    const nextUsernameError = username ? null : "Username is required.";
    const nextPasswordError = password ? null : "Password is required.";

    setUsernameError(nextUsernameError);
    setPasswordError(nextPasswordError);
    setSubmitted(!nextUsernameError && !nextPasswordError);
  };

  return (
    <section className="mx-auto max-w-[560px] rounded-[32px] border border-white/70 bg-white/95 p-8 shadow-panel backdrop-blur md:p-10">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.26em] text-brand">Internal access</p>
          <h2 className="m-0 text-3xl font-semibold text-slate-950">Account Access</h2>
          <p className="m-0 text-sm text-muted">Use internal credentials to continue.</p>
        </div>
        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800" htmlFor="username">
              Username
            </label>
            <input
              aria-describedby={usernameError ? "username-error" : undefined}
              className="w-full rounded-[20px] border border-border bg-slate-50 px-4 py-3 shadow-sm outline-none transition focus:border-brand focus:bg-white"
              id="username"
              name="username"
              type="text"
            />
            {usernameError ? (
              <p className="m-0 text-sm font-medium text-rose-600" id="username-error">
                {usernameError}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800" htmlFor="password">
              Password
            </label>
            <input
              aria-describedby={passwordError ? "password-error" : undefined}
              className="w-full rounded-[20px] border border-border bg-slate-50 px-4 py-3 shadow-sm outline-none transition focus:border-brand focus:bg-white"
              id="password"
              name="password"
              type="password"
            />
            {passwordError ? (
              <p className="m-0 text-sm font-medium text-rose-600" id="password-error">
                {passwordError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="m-0 text-xs font-medium text-muted">
              {submitted ? "Frontend-only placeholder." : "Client-side validation only during migration."}
            </p>
            <button className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#193cdc]" type="submit">
              Sign In
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

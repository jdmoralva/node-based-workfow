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
    <section className="rv-login-panel" data-testid="login-panel">
      <div className="flex justify-center">
        <div className="rv-hero rv-hero--compact" data-testid="page-hero">
          <span aria-hidden="true" className="rv-hero__edge" />
          <h1>SIGN IN</h1>
          <span aria-hidden="true" className="rv-hero__edge" />
        </div>
      </div>
      <form className="rv-login-form" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="rv-login-form__label" htmlFor="username">
              Username
            </label>
            <input
              aria-describedby={usernameError ? "username-error" : undefined}
              className={`rv-login-form__input ${usernameError ? "rv-login-form__input--invalid" : ""}`}
              id="username"
              name="username"
              type="text"
            />
            {usernameError ? (
              <p className="rv-login-form__feedback" id="username-error">
                {usernameError}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <label className="rv-login-form__label" htmlFor="password">
              Password
            </label>
            <input
              aria-describedby={passwordError ? "password-error" : undefined}
              className={`rv-login-form__input ${passwordError ? "rv-login-form__input--invalid" : ""}`}
              id="password"
              name="password"
              type="password"
            />
            {passwordError ? (
              <p className="rv-login-form__feedback" id="password-error">
                {passwordError}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            {submitted ? <p className="rv-login-form__result mr-auto">Frontend-only placeholder.</p> : null}
            <button className="rv-hero__action border-0" type="submit">
              Sign In
            </button>
          </div>
        </form>
    </section>
  );
}

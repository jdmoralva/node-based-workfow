"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { login } from "@/lib/auth/auth-client";
import { navigateTo } from "@/lib/auth/browser-navigation";
import { resolvePostLoginRedirectTarget } from "@/lib/auth/redirect-target";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    const nextUsernameError = username ? null : "Username is required.";
    const nextPasswordError = password ? null : "Password is required.";

    setUsernameError(nextUsernameError);
    setPasswordError(nextPasswordError);

    if (nextUsernameError || nextPasswordError) {
      setResultMessage(null);
      return;
    }

    setIsSubmitting(true);
    setResultMessage(null);

    const outcome = await login({ username, password });

    setIsSubmitting(false);

    if (outcome.kind === "authenticated") {
      navigateTo(resolvePostLoginRedirectTarget(searchParams.get("next")));
      return;
    }

    if (outcome.kind === "invalid_credentials" || outcome.kind === "backend_unavailable") {
      setResultMessage(outcome.message ?? null);
      return;
    }

    setResultMessage("Something went wrong. Please try again.");
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
      <form className="rv-login-form" data-auth-ready={isReady ? "true" : "false"} noValidate onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="rv-login-form__label" htmlFor="username">
              Username
            </label>
            <input
              aria-describedby={usernameError ? "username-error" : undefined}
              className={`rv-login-form__input ${usernameError ? "rv-login-form__input--invalid" : ""}`}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
            {resultMessage ? (
              <p aria-live="polite" className="rv-login-form__result mr-auto">
                {resultMessage}
              </p>
            ) : null}
            <button className="rv-hero__action border-0" disabled={isSubmitting} type="submit">
              Sign In
            </button>
          </div>
        </form>
    </section>
  );
}

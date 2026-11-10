"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
type Mode = "login" | "signup" | "verify" | "reset";
export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();
  function change(next: Mode) {
    setMode(next);
    setMessage("");
    setCodeSent(false);
  }
  return (
    <>
      <h1>
        {mode === "signup"
          ? "Make room for more colour."
          : mode === "verify"
            ? "Check your email."
            : mode === "reset"
              ? "A fresh start."
              : "Welcome to your plate."}
      </h1>
      <p className="auth-subtitle">
        {mode === "verify"
          ? "Enter the six-digit code sent to your email."
          : mode === "reset"
            ? "Reset your password using an emailed code."
            : "Familiar foods. Small discoveries. Your own pace."}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setMessage("");
          start(async () => {
            try {
              if (mode === "signup") {
                const result = await authClient.signUp.email({
                  name: String(form.get("name")),
                  email,
                  password: String(form.get("password")),
                });
                if (result.error) {
                  setMessage(
                    "Could not create your account. Check your details and email setup, or try signing in.",
                  );
                  return;
                }
                setMode("verify");
                setMessage("Your code is on its way.");
              } else if (mode === "verify") {
                const result = await authClient.emailOtp.verifyEmail({
                  email,
                  otp: String(form.get("otp")),
                });
                if (result.error) {
                  setMessage(
                    "That code could not be verified. Check the code or request a new one.",
                  );
                  return;
                }
                setMode("login");
                setMessage("Email verified. Sign in to start your plate.");
              } else if (mode === "reset") {
                if (!codeSent) {
                  const result = await authClient.emailOtp.requestPasswordReset(
                    { email },
                  );
                  if (result.error) {
                    setMessage(
                      "Could not request a code. Wait a minute and try again.",
                    );
                    return;
                  }
                  setCodeSent(true);
                  setMessage(
                    "If that email has an account, a code is on its way.",
                  );
                } else {
                  const result = await authClient.emailOtp.resetPassword({
                    email,
                    otp: String(form.get("otp")),
                    password: String(form.get("password")),
                  });
                  if (result.error) {
                    setMessage(
                      "Could not reset your password. Check the code and use at least 12 characters.",
                    );
                    return;
                  }
                  setMode("login");
                  setMessage(
                    "Password changed. Sign in with your new password.",
                  );
                }
              } else {
                const result = await authClient.signIn.email({
                  email,
                  password: String(form.get("password")),
                });
                if (result.error) {
                  setMessage(
                    "Could not sign in. Check your email and password, or verify your email first.",
                  );
                  return;
                }
                router.push("/");
                router.refresh();
              }
            } catch {
              setMessage(
                "Could not connect. Check the local app, database, and email setup, then try again.",
              );
            }
          });
        }}
      >
        {mode === "signup" && (
          <label>
            Your name
            <input name="name" autoComplete="name" required maxLength={120} />
          </label>
        )}
        <label>
          Email address
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {(mode === "login" ||
          mode === "signup" ||
          (mode === "reset" && codeSent)) && (
          <label>
            {mode === "reset" ? "New password" : "Password"}
            <input
              aria-label={mode === "reset" ? "New password" : "Password"}
              type="password"
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "login" ? 1 : 12}
              maxLength={128}
            />
            {mode !== "login" && <small>Use at least 12 characters.</small>}
          </label>
        )}
        {(mode === "verify" || (mode === "reset" && codeSent)) && (
          <label>
            Email code
            <input
              name="otp"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </label>
        )}
        <p role="status" className="form-message">
          {message}
        </p>
        <button disabled={pending} className="button auth-submit">
          {pending
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : mode === "verify"
                ? "Verify email"
                : mode === "reset"
                  ? codeSent
                    ? "Reset password"
                    : "Email a reset code"
                  : "Sign in"}
        </button>
      </form>
      <div className="auth-links">
        {mode === "login" ? (
          <>
            <button onClick={() => change("signup")}>Create an account</button>
            <button onClick={() => change("reset")}>Forgot password?</button>
            <button onClick={() => change("verify")}>Verify your email</button>
          </>
        ) : (
          <button onClick={() => change("login")}>Back to sign in</button>
        )}
        {mode === "verify" && (
          <button
            disabled={pending || !email}
            onClick={() =>
              start(async () => {
                try {
                  const result = await authClient.emailOtp.sendVerificationOtp({
                    email,
                    type: "email-verification",
                  });
                  setMessage(
                    result.error
                      ? "Could not send a code. Wait a minute and try again."
                      : "If your account needs verification, a new code is on its way.",
                  );
                } catch {
                  setMessage("Could not send a code. Check the email setup.");
                }
              })
            }
          >
            Email a new code
          </button>
        )}
      </div>
    </>
  );
}
export function SignOut() {
  const router = useRouter();
  return (
    <button
      className="button button-secondary"
      onClick={async () => {
        await authClient.signOut();
        router.push("/auth");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

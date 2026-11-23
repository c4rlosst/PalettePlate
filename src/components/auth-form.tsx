"use client";
import { useState, useTransition } from "react";
import type { FormEvent, InputHTMLAttributes, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { colours } from "@/lib/rainbow";

type View = "login" | "signup" | "verify" | "reset";

const copy: Record<View, { title: string; subtitle: string }> = {
  login: {
    title: "Welcome to your plate.",
    subtitle: "Familiar foods. Small discoveries. Your own pace.",
  },
  signup: {
    title: "Make room for more colour.",
    subtitle: "Create an account to save your favourites and log your meals.",
  },
  verify: {
    title: "Check your email.",
    subtitle: "Enter the six-digit code we sent to your email.",
  },
  reset: {
    title: "A fresh start.",
    subtitle: "Reset your password using an emailed code.",
  },
};

function Field({
  icon,
  label,
  type,
  ...props
}: { icon: ReactNode; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  return (
    <label className={`auth-field ${isPassword ? "has-toggle" : ""}`}>
      <span className="auth-field-icon">{icon}</span>
      <input
        {...props}
        type={isPassword && shown ? "text" : type}
        placeholder={label}
        aria-label={label}
      />
      {isPassword && (
        <button
          type="button"
          className="auth-eye"
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          onClick={() => setShown((s) => !s)}
        >
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </label>
  );
}

/*
 * One card for everything: a "Sign in / Create account" switch, then the form
 * for the chosen view. The email-code steps (verify, reset) replace the
 * switch with a back link.
 */
export function AuthForm() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function go(next: View) {
    setView(next);
    setMessage("");
    setCodeSent(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    start(async () => {
      try {
        if (view === "signup") {
          const result = await authClient.signUp.email({
            name: String(form.get("name")),
            email,
            password: String(form.get("password")),
          });
          if (result.error) {
            setMessage(
              "Could not create your account. Check your details, or try signing in.",
            );
            return;
          }
          setView("verify");
          setMessage("Your code is on its way. Enter it to verify your email.");
        } else if (view === "verify") {
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
          setView("login");
          setMessage("Email verified. Sign in to start your plate.");
        } else if (view === "reset") {
          if (!codeSent) {
            const result = await authClient.emailOtp.requestPasswordReset({
              email,
            });
            if (result.error) {
              setMessage(
                "Could not request a code. Wait a minute and try again.",
              );
              return;
            }
            setCodeSent(true);
            setMessage("If that email has an account, a code is on its way.");
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
            setView("login");
            setCodeSent(false);
            setMessage("Password changed. Sign in with your new password.");
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
        setMessage("Could not connect. Check your connection and try again.");
      }
    });
  }

  const submitLabel =
    view === "signup"
      ? "Create account"
      : view === "verify"
        ? "Verify email"
        : view === "reset"
          ? codeSent
            ? "Reset password"
            : "Email a reset code"
          : "Sign in";

  return (
    <div className="auth-card">
      <div className="auth-dots" aria-hidden="true">
        {colours.map((c) => (
          <span key={c} className={`mini-dot ${c}`} />
        ))}
      </div>

      {view === "login" || view === "signup" ? (
        <div className="auth-tabs" role="group" aria-label="Account">
          <button
            type="button"
            className="auth-tab"
            aria-pressed={view === "login"}
            onClick={() => go("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className="auth-tab"
            aria-pressed={view === "signup"}
            onClick={() => go("signup")}
          >
            Create account
          </button>
        </div>
      ) : (
        <button type="button" className="auth-back" onClick={() => go("login")}>
          <ArrowLeft size={16} /> Back to sign in
        </button>
      )}

      <div className="auth-body" key={view}>
        <h1>{copy[view].title}</h1>
        <p className="auth-subtitle">{copy[view].subtitle}</p>
        <form onSubmit={submit}>
          {view === "signup" && (
            <Field
              icon={<User size={18} />}
              label="Your name"
              name="name"
              autoComplete="name"
              required
              maxLength={120}
            />
          )}
          <Field
            icon={<Mail size={18} />}
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {(view === "login" || view === "signup") && (
            <Field
              icon={<Lock size={18} />}
              label={
                view === "signup" ? "Password (12+ characters)" : "Password"
              }
              type="password"
              name="password"
              autoComplete={
                view === "signup" ? "new-password" : "current-password"
              }
              required
              minLength={view === "signup" ? 12 : 1}
              maxLength={128}
            />
          )}
          {(view === "verify" || (view === "reset" && codeSent)) && (
            <Field
              icon={<KeyRound size={18} />}
              label="Six-digit email code"
              name="otp"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          )}
          {view === "reset" && codeSent && (
            <Field
              icon={<Lock size={18} />}
              label="New password (12+ characters)"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          )}
          <p role="status" className="form-message">
            {message}
          </p>
          <button disabled={pending} className="button auth-submit">
            {pending ? "Please wait…" : submitLabel}
          </button>
        </form>
        {view === "login" && (
          <div className="auth-links">
            <button type="button" onClick={() => go("reset")}>
              Forgot password?
            </button>
            <button type="button" onClick={() => go("verify")}>
              Verify your email
            </button>
          </div>
        )}
        {view === "verify" && (
          <div className="auth-links">
            <button
              type="button"
              disabled={pending || !email}
              onClick={() =>
                start(async () => {
                  try {
                    const result =
                      await authClient.emailOtp.sendVerificationOtp({
                        email,
                        type: "email-verification",
                      });
                    setMessage(
                      result.error
                        ? "Could not send a code. Wait a minute and try again."
                        : "If your account needs verification, a new code is on its way.",
                    );
                  } catch {
                    setMessage("Could not send a code. Try again soon.");
                  }
                })
              }
            >
              Email a new code
            </button>
          </div>
        )}
      </div>
    </div>
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

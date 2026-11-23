"use client";
import { useState, useTransition } from "react";
import type { FormEvent, InputHTMLAttributes, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Mail, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "verify" | "reset";
type Kind = "login" | "signup" | "verify" | "reset";

/*
 * A sign-in / sign-up card. A large green circle slides across the card and
 * swaps which form is showing. The sign-in side also hosts the email-code
 * steps (verify email, reset password). The layout stacks vertically when the
 * card is narrower than 640px (CSS container query).
 */

function Field({
  icon,
  label,
  ...props
}: { icon: ReactNode; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="slide-field">
      <span className="slide-field-icon">{icon}</span>
      <input {...props} placeholder={label} aria-label={label} />
    </label>
  );
}

function SlideForm({
  title,
  submitLabel,
  active,
  pending,
  message,
  onSubmit,
  links,
  children,
}: {
  title: string;
  submitLabel: string;
  active: boolean;
  pending: boolean;
  message: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  links?: ReactNode;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      inert={!active}
      className={`slide-form ${active ? "is-active" : ""}`}
    >
      <h2>{title}</h2>
      {children}
      <p role="status" className="form-message">
        {active ? message : ""}
      </p>
      <button disabled={pending} className="button button-sun slide-submit">
        {pending ? "Please wait…" : submitLabel}
      </button>
      {links && <div className="slide-links">{links}</div>}
    </form>
  );
}

function Panel({
  side,
  isSignUp,
  title,
  text,
  cta,
  onClick,
}: {
  side: "left" | "right";
  isSignUp: boolean;
  title: string;
  text: string;
  cta: string;
  onClick: () => void;
}) {
  const active = side === "left" ? !isSignUp : isSignUp;
  return (
    <div
      className={`slide-panel slide-panel-${side} ${active ? "is-active" : ""}`}
    >
      <div className="slide-panel-body" inert={!active}>
        <h3>{title}</h3>
        <p>{text}</p>
        <button type="button" className="slide-ghost" onClick={onClick}>
          {cta}
        </button>
      </div>
    </div>
  );
}

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function show(next: Mode) {
    setMode(next);
    setMessage("");
    setCodeSent(false);
  }
  function slide(toSignUp: boolean) {
    setIsSignUp(toSignUp);
    setMessage("");
    if (!toSignUp) show("login");
  }

  function submit(kind: Kind) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setMessage("");
      start(async () => {
        try {
          if (kind === "signup") {
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
            setIsSignUp(false);
            setMode("verify");
            setMessage("Your code is on its way. Enter it to verify your email.");
          } else if (kind === "verify") {
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
          } else if (kind === "reset") {
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
              setMode("login");
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
    };
  }

  const emailField = (
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
  );

  const rightKind: Kind = mode;
  const rightTitle =
    mode === "verify"
      ? "Check your email"
      : mode === "reset"
        ? "Reset password"
        : "Sign in";
  const rightSubmit =
    mode === "verify"
      ? "Verify"
      : mode === "reset"
        ? codeSent
          ? "Reset"
          : "Send code"
        : "Login";

  return (
    <div className="auth-switch">
      <div className={`slide-card ${isSignUp ? "is-signup" : ""}`}>
        <div aria-hidden="true" className="slide-circle" />
        <div className="slide-forms">
          <div className="slide-forms-inner">
            <SlideForm
              title={rightTitle}
              submitLabel={rightSubmit}
              active={!isSignUp}
              pending={pending}
              message={message}
              onSubmit={submit(rightKind)}
              links={
                mode === "login" ? (
                  <>
                    <button type="button" onClick={() => show("reset")}>
                      Forgot password?
                    </button>
                    <button type="button" onClick={() => show("verify")}>
                      Verify your email
                    </button>
                  </>
                ) : mode === "verify" ? (
                  <>
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
                    <button type="button" onClick={() => show("login")}>
                      Back to sign in
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => show("login")}>
                    Back to sign in
                  </button>
                )
              }
            >
              {emailField}
              {mode === "login" && (
                <Field
                  icon={<Lock size={18} />}
                  label="Password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />
              )}
              {(mode === "verify" || (mode === "reset" && codeSent)) && (
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
              {mode === "reset" && codeSent && (
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
            </SlideForm>

            <SlideForm
              title="Sign up"
              submitLabel="Create account"
              active={isSignUp}
              pending={pending}
              message={message}
              onSubmit={submit("signup")}
            >
              <Field
                icon={<User size={18} />}
                label="Your name"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
              />
              {emailField}
              <Field
                icon={<Lock size={18} />}
                label="Password (12+ characters)"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
            </SlideForm>
          </div>
        </div>
        <div className="slide-panels">
          <Panel
            side="left"
            isSignUp={isSignUp}
            title="New here?"
            text="Create an account and start your own colourful plate."
            cta="Sign up"
            onClick={() => slide(true)}
          />
          <Panel
            side="right"
            isSignUp={isSignUp}
            title="Welcome back!"
            text="Sign in to keep your colours going."
            cta="Sign in"
            onClick={() => slide(false)}
          />
        </div>
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

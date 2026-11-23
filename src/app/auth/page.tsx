import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function Auth() {
  return (
    <main id="main-content" className="auth-page">
      <Link className="brand" href="/">
        <img
          className="brand-logo"
          src="/logo.png"
          alt=""
          width={46}
          height={45}
        />
        <span className="wordmark">
          <strong>Palette</strong>
          <span>Plate</span>
        </span>
      </Link>
      <AuthForm />
      <p className="auth-foot">
        Made for everyday Filipino meals. Small choices, at your own pace.
      </p>
    </main>
  );
}

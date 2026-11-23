import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Rainbow } from "@/components/rainbow";
export default function Auth() {
  return (
    <main id="main-content" className="auth-page">
      <section className="auth-story">
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
        <div>
          <p className="date-line">Made for everyday Filipino meals</p>
          <h2>
            Good food.
            <br />A little more colour.
          </h2>
          <p>
            From your favourite palengke finds to a home-cooked meal, there’s
            room for it on your plate.
          </p>
          <Rainbow />
        </div>
        <span className="muted">Small choices, at your own pace.</span>
      </section>
      <section className="auth-panel">
        <div>
          <AuthForm />
        </div>
      </section>
    </main>
  );
}

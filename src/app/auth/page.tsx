import Link from "next/link";
import { Leaf } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Rainbow } from "@/components/rainbow";
export default function Auth() {
  return (
    <main id="main-content" className="auth-page">
      <section className="auth-story">
        <Link className="brand" href="/">
          <span className="brand-symbol">
            <Leaf size={23} />
          </span>
          PalettePlate.
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

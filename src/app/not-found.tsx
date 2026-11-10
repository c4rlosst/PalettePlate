import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="error-page">
      <h1>This page isn’t on the menu.</h1>
      <p>Head back to your plate to keep exploring.</p>
      <Link className="button" href="/">
        Back to today
      </Link>
    </main>
  );
}

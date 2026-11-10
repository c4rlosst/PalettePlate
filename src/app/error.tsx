"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="error-page">
      <h1>We couldn’t load your plate.</h1>
      <p>
        Check the local database connection, then try again. Your saved meals
        are still in the database.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <a href="/">Back to today</a>
    </main>
  );
}

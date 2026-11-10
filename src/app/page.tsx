import Link from "next/link";
import { Plus, Utensils, Leaf, Search, Sun, Check } from "lucide-react";
import { Shell } from "@/components/shell";
import { Rainbow } from "@/components/rainbow";
import { manilaDay, rainbowDay } from "@/lib/rainbow";
import { currentActor } from "@/server/session";
import { dailyEntries, browseFoods, getProfile } from "@/server/data";
import { DeleteMeal } from "@/components/forms";
export const dynamic = "force-dynamic";
export default async function Today() {
  let actor = null;
  let setup = false;
  let unavailable = false;
  try {
    actor = await currentActor();
  } catch {
    setup = true;
  }
  let rows: Awaited<ReturnType<typeof dailyEntries>> = [];
  let liked: Awaited<ReturnType<typeof browseFoods>> = [];
  let name = "";
  if (actor?.emailVerified) {
    try {
      [rows, liked] = await Promise.all([
        dailyEntries(actor, manilaDay()),
        browseFoods(actor, {}),
      ]);
      name = (await getProfile(actor))?.name.split(" ")[0] || "";
    } catch {
      unavailable = true;
    }
  }
  const rainbow = rainbowDay(rows);
  const suggestions = liked
    .filter(
      (f) =>
        f.preference === "liked" &&
        f.category !== "grain" &&
        rainbow.missing.includes(f.colour),
    )
    .slice(0, 3);
  const meals = [
    ...new Map(
      rows.map((row) => [
        row.id,
        { id: row.id, type: row.mealType, time: row.eatenAt },
      ]),
    ).values(),
  ];
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <p className="date-line">
            {new Intl.DateTimeFormat("en-PH", {
              timeZone: "Asia/Manila",
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </p>
          <h1>{name ? `Hello, ${name}.` : "A little colour, every day."}</h1>
          <p>Make room for the foods you love.</p>
        </div>
        <span className="heading-icon">
          <Sun size={28} />
        </span>
      </div>
      {setup ? (
        <div className="notice">
          <strong>Your plate is almost ready.</strong>
          <span>
            Finish the local MySQL and email setup in the README to start
            logging meals.
          </span>
        </div>
      ) : !actor?.emailVerified ? (
        <div className="notice">
          <div>
            <strong>Your everyday meals, all in one place.</strong>
            <span>
              Create an account to save your foods and start your own colour
              palette.
            </span>
          </div>
          <Link className="button button-small" href="/auth">
            Get started
          </Link>
        </div>
      ) : null}
      {unavailable && (
        <p role="alert" className="error">
          We couldn’t load your meals. Check the database connection and refresh
          this page.
        </p>
      )}
      <section className="rainbow-panel">
        <div className="section-heading">
          <div>
            <div className="inline-label">
              <Leaf size={17} />
              Your colours today
            </div>
            <h2>Every colour brings something good.</h2>
          </div>
          <span className="subtle-pill">{rainbow.count} colours enjoyed</span>
        </div>
        <Rainbow eaten={rainbow.eaten} />
        <div className="rainbow-bottom">
          <p>
            {rainbow.complete ? (
              <>
                <Check size={16} />
                You’ve enjoyed four or more colours today. Keep exploring at
                your own pace.
              </>
            ) : (
              <>
                Explore fruits and vegetables from four colour groups, at your
                own pace.
              </>
            )}
          </p>
          <Link href="/log" className="button">
            <Plus size={17} />
            Log meal
          </Link>
        </div>
      </section>
      <div className="daily-grid">
        <section>
          <div className="section-heading">
            <h2>On your plate</h2>
            <span className="muted">Today</span>
          </div>
          {meals.length ? (
            meals.map((meal) => (
              <article className="meal-row" key={meal.id}>
                <div className="meal-icon">
                  <Utensils size={20} />
                </div>
                <div>
                  <h3 className="capitalize">{meal.type}</h3>
                  <p>
                    {rows
                      .filter((r) => r.id === meal.id)
                      .map((r) => r.filipinoName)
                      .join(", ")}
                  </p>
                  <small>
                    {new Intl.DateTimeFormat("en-PH", {
                      timeZone: "Asia/Manila",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(meal.time)}
                  </small>
                </div>
                <DeleteMeal id={meal.id} />
              </article>
            ))
          ) : (
            <div className="empty-meals">
              <span className="empty-icon">
                <Utensils size={28} />
              </span>
              <h3>What’s on your plate?</h3>
              <p>
                Your meals will appear here.
                <br />
                Start with something you enjoyed today.
              </p>
              <Link href="/log" className="text-link">
                Log your first meal
              </Link>
            </div>
          )}
        </section>
        <aside className="suggestion-panel">
          <span className="suggestion-icon">
            <Leaf size={23} />
          </span>
          <h2>A little inspiration</h2>
          {suggestions.length ? (
            <>
              <p>
                A familiar favourite could bring another colour to your day.
              </p>
              {suggestions.map((f) => (
                <Link
                  href={`/log?food=${encodeURIComponent(f.id)}`}
                  className="suggestion-row"
                  key={f.id}
                >
                  <span className={`mini-dot ${f.colour}`} />
                  <span>
                    <strong>{f.filipinoName}</strong>
                    <small>{f.englishName}</small>
                  </span>
                  <Plus size={17} />
                </Link>
              ))}
            </>
          ) : (
            <>
              <p>
                Find familiar foods and mark your favourites. We’ll suggest ones
                that bring a little more colour.
              </p>
              <Link className="button button-secondary" href="/foods">
                <Search size={16} />
                Explore foods
              </Link>
            </>
          )}
          <div className="tip">
            <strong>Made for your everyday meals</strong>
            <p>From kangkong to kalabasa, discover foods close to home.</p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

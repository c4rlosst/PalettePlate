import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { pageActor } from "@/server/page-access";
import { listRecipes } from "@/server/data";
import { colourLabels } from "@/lib/rainbow";
export const dynamic = "force-dynamic";
export default async function Recipes() {
  const actor = await pageActor();
  if (!actor)
    return (
      <Shell active="Recipes">
        <Setup />
      </Shell>
    );
  const list = await listRecipes(actor);
  const isAdmin = actor.role === "admin";
  return (
    <Shell active="Recipes">
      <div className="page-heading">
        <div>
          <h1>Recipes</h1>
          <p>Filipino dishes with every ingredient and step.</p>
        </div>
        {isAdmin && (
          <Link href="/recipes/new" className="button">
            <Plus size={17} />
            New recipe
          </Link>
        )}
      </div>
      {list.length ? (
        <div className="recipe-grid">
          {list.map((r) => (
            <Link href={`/recipes/${r.id}`} className="recipe-card" key={r.id}>
              <span className="recipe-meal">{r.mealType}</span>
              <h2>{r.name}</h2>
              {r.description && <p>{r.description}</p>}
              <div className="recipe-meta">
                <span>
                  {r.ingredientCount}{" "}
                  {r.ingredientCount === 1 ? "ingredient" : "ingredients"}
                </span>
                <span className="recipe-dots">
                  {r.colours.map((c) => (
                    <i
                      key={c}
                      className={`mini-dot ${c}`}
                      title={colourLabels[c]}
                    />
                  ))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-meals">
          <span className="empty-icon">
            <BookOpen size={28} />
          </span>
          <h3>No recipes yet.</h3>
          <p>
            {isAdmin
              ? "Add the first dish, with its ingredients and steps."
              : "New recipes will show up here soon."}
          </p>
          {isAdmin && (
            <Link href="/recipes/new" className="button">
              Write the first recipe
            </Link>
          )}
        </div>
      )}
    </Shell>
  );
}

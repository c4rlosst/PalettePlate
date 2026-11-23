import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { DeleteRecipe } from "@/components/recipe-form";
import { pageActor } from "@/server/page-access";
import { getRecipe } from "@/server/data";
import { colourLabels, rainbowDay } from "@/lib/rainbow";
export const dynamic = "force-dynamic";
export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await pageActor();
  const { id } = await params;
  if (!actor)
    return (
      <Shell active="Recipes">
        <Setup />
      </Shell>
    );
  let data: Awaited<ReturnType<typeof getRecipe>>;
  try {
    data = await getRecipe(actor, id);
  } catch {
    notFound();
  }
  const { recipe, ingredients } = data;
  const groups: { title: string; items: typeof ingredients }[] = [];
  for (const line of ingredients) {
    const last = groups[groups.length - 1];
    if (last && last.title === line.section) last.items.push(line);
    else groups.push({ title: line.section, items: [line] });
  }
  const steps = (recipe.instructions || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const rainbow = rainbowDay(
    ingredients.flatMap((i) =>
      i.colour && i.category ? [{ colour: i.colour, category: i.category }] : [],
    ),
  );
  return (
    <Shell active="Recipes">
      <article className="recipe-detail">
        <Link href="/recipes" className="back-link">
          <ArrowLeft size={16} /> All recipes
        </Link>
        <p className="date-line capitalize">
          {recipe.mealType} ·{" "}
          {new Intl.DateTimeFormat("en-PH", {
            timeZone: "Asia/Manila",
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(recipe.createdAt)}
        </p>
        <h1>{recipe.name}</h1>
        {recipe.description && (
          <p className="recipe-intro">{recipe.description}</p>
        )}
        {rainbow.count > 0 && (
          <p className="recipe-colors">
            <span className="recipe-dots">
              {rainbow.eaten.map((c) => (
                <i
                  key={c}
                  className={`mini-dot ${c}`}
                  title={colourLabels[c]}
                />
              ))}
            </span>
            Brings {rainbow.count} {rainbow.count === 1 ? "color" : "colors"}:{" "}
            {rainbow.eaten.map((c) => colourLabels[c]).join(", ")}
          </p>
        )}
        <section className="recipe-section">
          <h2>Ingredients</h2>
          {groups.map((g, index) => (
            <div key={`${g.title}-${index}`} className="ingredient-block">
              {g.title && <h3>{g.title}</h3>}
              <ul className="ingredient-list">
                {g.items.map((i) => (
                  <li key={i.id}>
                    {i.colour && <i className={`mini-dot ${i.colour}`} />}
                    <span>
                      {i.amount && <strong>{i.amount} </strong>}
                      {i.item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        {steps.length > 0 && (
          <section className="recipe-section">
            <h2>Instructions</h2>
            <ol className="step-list">
              {steps.map((s, index) => (
                <li key={index}>{s}</li>
              ))}
            </ol>
          </section>
        )}
        <DeleteRecipe id={recipe.id} />
      </article>
    </Shell>
  );
}

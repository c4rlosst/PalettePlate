import { notFound, redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { RecipeForm, type RecipeInitial } from "@/components/recipe-form";
import { pageActor } from "@/server/page-access";
import { browseFoods, getRecipe } from "@/server/data";
export const dynamic = "force-dynamic";
export default async function EditRecipe({
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
  if (actor.role !== "admin") redirect(`/recipes/${id}`);
  let data: Awaited<ReturnType<typeof getRecipe>>;
  try {
    data = await getRecipe(actor, id);
  } catch {
    notFound();
  }
  const foods = await browseFoods(actor, {});
  const sections: RecipeInitial["sections"] = [];
  for (const line of data.ingredients) {
    const item = {
      amount: line.amount,
      item: line.item,
      foodId: line.foodId ?? "",
    };
    const last = sections[sections.length - 1];
    if (last && last.title === line.section) last.items.push(item);
    else sections.push({ title: line.section, items: [item] });
  }
  const initial: RecipeInitial = {
    id: data.recipe.id,
    name: data.recipe.name,
    mealType: data.recipe.mealType,
    description: data.recipe.description,
    instructions: data.recipe.instructions ?? "",
    sections,
  };
  return (
    <Shell active="Recipes">
      <div className="page-heading">
        <div>
          <h1>Edit recipe</h1>
          <p>Change anything, then save. Only admins can do this.</p>
        </div>
      </div>
      <RecipeForm foods={foods} initial={initial} />
    </Shell>
  );
}

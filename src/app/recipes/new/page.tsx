import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { RecipeForm } from "@/components/recipe-form";
import { pageActor } from "@/server/page-access";
import { browseFoods } from "@/server/data";
export const dynamic = "force-dynamic";
export default async function NewRecipe() {
  const actor = await pageActor();
  if (!actor)
    return (
      <Shell active="Recipes">
        <Setup />
      </Shell>
    );
  const foods = await browseFoods(actor, {});
  return (
    <Shell active="Recipes">
      <div className="page-heading">
        <div>
          <h1>New recipe</h1>
          <p>Add each ingredient with its amount, in groups if you like.</p>
        </div>
      </div>
      <RecipeForm foods={foods} />
    </Shell>
  );
}

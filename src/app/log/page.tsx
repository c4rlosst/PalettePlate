import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { MealForm } from "@/components/forms";
import { pageActor } from "@/server/page-access";
import { browseFoods } from "@/server/data";
export const dynamic = "force-dynamic";
export default async function Log({
  searchParams,
}: {
  searchParams: Promise<{ food?: string }>;
}) {
  const actor = await pageActor();
  if (!actor)
    return (
      <Shell active="Log meal">
        <Setup />
      </Shell>
    );
  const foods = await browseFoods(actor, {});
  const params = await searchParams;
  return (
    <Shell active="Log meal">
      <div className="page-heading">
        <div>
          <h1>Log meal</h1>
          <p>Choose the foods you ate. No weighing or calorie counting.</p>
        </div>
      </div>
      {foods.length ? (
        <MealForm foods={foods} initialFood={params.food} />
      ) : (
        <Setup />
      )}
    </Shell>
  );
}

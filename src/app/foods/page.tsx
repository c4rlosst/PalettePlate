import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { FoodTiles } from "@/components/forms";
import { pageActor } from "@/server/page-access";
import { browseFoods } from "@/server/data";
import { colours, colourLabels } from "@/lib/rainbow";
export const dynamic = "force-dynamic";
export default async function Foods({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await pageActor();
  const params = await searchParams;
  if (!actor)
    return (
      <Shell active="Foods">
        <Setup />
      </Shell>
    );
  const query = {
    search: (params.search || "").slice(0, 100),
    ...(colours.includes(params.colour as (typeof colours)[number])
      ? { colour: params.colour }
      : {}),
    ...(["fruit", "vegetable", "grain"].includes(params.category || "")
      ? { category: params.category }
      : {}),
  };
  const foods = await browseFoods(actor, query);
  return (
    <Shell active="Foods">
      <div className="page-heading">
        <div>
          <p className="date-line">Familiar foods, fresh possibilities</p>
          <h1>Find your favourites.</h1>
          <p>Explore local foods. Like what you enjoy, skip what you don’t.</p>
        </div>
      </div>
      <form className="food-filters" action="/foods">
        <label className="search-field">
          Search foods
          <input
            type="search"
            name="search"
            placeholder="Try kalabasa or squash"
            defaultValue={params.search}
          />
        </label>
        <label>
          Colour
          <select name="colour" defaultValue={params.colour || ""}>
            <option value="">All colours</option>
            {colours.map((c) => (
              <option value={c} key={c}>
                {colourLabels[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select name="category" defaultValue={params.category || ""}>
            <option value="">All foods</option>
            <option value="fruit">Fruit</option>
            <option value="vegetable">Vegetable</option>
            <option value="grain">Grain</option>
          </select>
        </label>
        <button className="button">Find foods</button>
      </form>
      <div className="section-heading">
        <h2>Foods close to home</h2>
        <span className="muted">{foods.length} foods</span>
      </div>
      {foods.length ? (
        <FoodTiles foods={foods} />
      ) : (
        <div className="empty-meals">
          <h3>No foods found yet.</h3>
          <p>
            Try another search or clear your filters. If the list is empty, run
            the food seed script.
          </p>
        </div>
      )}
    </Shell>
  );
}

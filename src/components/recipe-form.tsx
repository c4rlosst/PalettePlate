"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { createRecipeAction, deleteRecipeAction } from "@/app/actions";
import { colourLabels, type Colour } from "@/lib/rainbow";

type FoodOption = {
  id: string;
  filipinoName: string;
  englishName: string;
  colour: Colour;
  category: string;
};
type Item = { key: number; amount: string; item: string; foodId: string };
type Section = { key: number; title: string; items: Item[] };

export function RecipeForm({ foods }: { foods: FoodOption[] }) {
  const keys = useRef(10);
  const nextKey = () => ++keys.current;
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState("dinner");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [sections, setSections] = useState<Section[]>([
    { key: 1, title: "", items: [{ key: 2, amount: "", item: "", foodId: "" }] },
  ]);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const colorFoods = foods.filter((f) => f.category !== "grain");

  function patchSection(key: number, patch: Partial<Section>) {
    setSections((all) =>
      all.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );
  }
  function patchItem(sKey: number, iKey: number, patch: Partial<Item>) {
    setSections((all) =>
      all.map((s) =>
        s.key === sKey
          ? {
              ...s,
              items: s.items.map((i) =>
                i.key === iKey ? { ...i, ...patch } : i,
              ),
            }
          : s,
      ),
    );
  }
  function addItem(sKey: number) {
    setSections((all) =>
      all.map((s) =>
        s.key === sKey
          ? {
              ...s,
              items: [
                ...s.items,
                { key: nextKey(), amount: "", item: "", foodId: "" },
              ],
            }
          : s,
      ),
    );
  }
  function removeItem(sKey: number, iKey: number) {
    setSections((all) =>
      all.map((s) =>
        s.key === sKey && s.items.length > 1
          ? { ...s, items: s.items.filter((i) => i.key !== iKey) }
          : s,
      ),
    );
  }

  const filled = sections.reduce(
    (n, s) => n + s.items.filter((i) => i.item.trim()).length,
    0,
  );

  return (
    <form
      className="recipe-form"
      onSubmit={(event) => {
        event.preventDefault();
        const payload = {
          name,
          mealType,
          description,
          instructions,
          sections: sections
            .map((s) => ({
              title: s.title,
              items: s.items
                .filter((i) => i.item.trim())
                .map((i) => ({
                  amount: i.amount,
                  item: i.item,
                  foodId: i.foodId,
                })),
            }))
            .filter((s) => s.items.length),
        };
        setMessage("");
        start(async () => {
          const result = await createRecipeAction(payload);
          if (!result.ok || !result.id) {
            setMessage(result.message);
            return;
          }
          router.push(`/recipes/${result.id}`);
          router.refresh();
        });
      }}
    >
      <div className="form-row">
        <label>
          Recipe name
          <input
            required
            maxLength={160}
            placeholder="e.g. Kare-kare"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Meal
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </label>
      </div>
      <label>
        About this recipe
        <textarea
          rows={3}
          maxLength={2000}
          placeholder="A short intro: where it comes from, or when you cook it."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <h2 className="form-heading">Ingredients</h2>
      {sections.map((section) => (
        <fieldset className="ingredient-group" key={section.key}>
          <legend className="visually-hidden">Ingredient group</legend>
          <div className="group-head">
            <input
              aria-label="Group name"
              maxLength={80}
              placeholder="Group name (optional), e.g. Sauce and aromatics"
              value={section.title}
              onChange={(e) =>
                patchSection(section.key, { title: e.target.value })
              }
            />
            {sections.length > 1 && (
              <button
                type="button"
                className="icon-button"
                aria-label="Remove this group"
                onClick={() =>
                  setSections((all) => all.filter((s) => s.key !== section.key))
                }
              >
                <X size={18} />
              </button>
            )}
          </div>
          {section.items.map((item) => (
            <div className="ingredient-row" key={item.key}>
              <input
                aria-label="Amount"
                maxLength={100}
                placeholder="1 kg"
                value={item.amount}
                onChange={(e) =>
                  patchItem(section.key, item.key, { amount: e.target.value })
                }
              />
              <input
                aria-label="Ingredient"
                maxLength={200}
                placeholder="oxtail, cut into 2-inch pieces"
                value={item.item}
                onChange={(e) =>
                  patchItem(section.key, item.key, { item: e.target.value })
                }
              />
              <select
                aria-label="Counts toward a color"
                value={item.foodId}
                onChange={(e) =>
                  patchItem(section.key, item.key, { foodId: e.target.value })
                }
              >
                <option value="">No color</option>
                {colorFoods.map((f) => (
                  <option value={f.id} key={f.id}>
                    {f.filipinoName} ({colourLabels[f.colour]})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                aria-label="Remove ingredient"
                disabled={section.items.length === 1}
                onClick={() => removeItem(section.key, item.key)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => addItem(section.key)}
          >
            <Plus size={16} /> Add ingredient
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="button button-secondary"
        onClick={() =>
          setSections((all) => [
            ...all,
            {
              key: nextKey(),
              title: "",
              items: [{ key: nextKey(), amount: "", item: "", foodId: "" }],
            },
          ])
        }
      >
        <Plus size={17} /> Add another group
      </button>

      <label className="instructions-field">
        Instructions
        <textarea
          rows={8}
          maxLength={8000}
          placeholder="One step per line."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </label>

      <div className="save-bar">
        <span>
          {filled} {filled === 1 ? "ingredient" : "ingredients"}
        </span>
        <button className="button" disabled={pending || !filled}>
          {pending ? "Saving recipe…" : "Save recipe"}
        </button>
      </div>
      <p role="status" className="form-message">
        {message}
      </p>
    </form>
  );
}

export function DeleteRecipe({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <div className="delete-recipe">
      <button
        className="button button-secondary"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete this recipe? This cannot be undone."))
            return;
          start(async () => {
            const result = await deleteRecipeAction(id);
            if (!result.ok) {
              setMessage(result.message);
              return;
            }
            router.push("/recipes");
            router.refresh();
          });
        }}
      >
        <Trash2 size={16} /> {pending ? "Deleting…" : "Delete recipe"}
      </button>
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, ThumbsDown, Check, Trash2, Plus } from "lucide-react";
import {
  mealAction,
  preferenceAction,
  deleteMealAction,
  profileAction,
} from "@/app/actions";
import type { browseFoods } from "@/server/data";
import { colourLabels } from "@/lib/rainbow";
import { FoodArt } from "./food-art";
type Food = Awaited<ReturnType<typeof browseFoods>>[number];
export function FoodTiles({
  foods,
  selectable = false,
  selected = [],
  onSelect,
}: {
  foods: Food[];
  selectable?: boolean;
  selected?: string[];
  onSelect?: (id: string) => void;
}) {
  const [busy, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  function prefer(food: Food, preference: "liked" | "disliked") {
    start(async () => {
      const result = await preferenceAction({
        foodId: food.id,
        preference: food.preference === preference ? "clear" : preference,
      });
      setMessage(result.ok ? "Preference saved." : result.message);
      if (result.ok) router.refresh();
    });
  }
  return (
    <>
      <div className="food-grid">
        {foods.map((food) => (
          <article
            key={food.id}
            className={`food-tile ${selected.includes(food.id) ? "selected" : ""}`}
          >
            <div className={`food-art ${food.colour}`} aria-hidden="true">
              <FoodArt id={food.id} />
            </div>
            <h3>{food.filipinoName}</h3>
            <p>{food.englishName}</p>
            <span className="food-colour">
              <i className={`mini-dot ${food.colour}`} />
              {colourLabels[food.colour]}
            </span>
            {selectable ? (
              <button
                type="button"
                className={`select-food ${selected.includes(food.id) ? "is-selected" : ""}`}
                onClick={() => onSelect?.(food.id)}
                aria-pressed={selected.includes(food.id)}
              >
                {selected.includes(food.id) ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}{" "}
                {selected.includes(food.id) ? "Selected" : "Add food"}
              </button>
            ) : (
              <div className="preference-controls">
                <button
                  disabled={busy}
                  aria-label={`Like ${food.filipinoName}`}
                  aria-pressed={food.preference === "liked"}
                  onClick={() => prefer(food, "liked")}
                >
                  <Heart
                    size={17}
                    fill={food.preference === "liked" ? "currentColor" : "none"}
                  />
                  <span>Like</span>
                </button>
                <button
                  disabled={busy}
                  aria-label={`Dislike ${food.filipinoName}`}
                  aria-pressed={food.preference === "disliked"}
                  onClick={() => prefer(food, "disliked")}
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      <p className="form-message" role="status">
        {message}
      </p>
    </>
  );
}
export function MealForm({
  foods,
  initialFood,
}: {
  foods: Food[];
  initialFood?: string;
}) {
  const [selected, setSelected] = useState<string[]>(
    initialFood && foods.some((f) => f.id === initialFood) ? [initialFood] : [],
  );
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const now = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date())
    .replace(" ", "T");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await mealAction({
            mealType: form.get("mealType"),
            localTime: form.get("localTime"),
            foodIds: selected,
          });
          setMessage(result.message);
          if (result.ok) {
            router.push("/");
            router.refresh();
          }
        });
      }}
    >
      <div className="form-row">
        <label>
          Meal
          <select name="mealType" defaultValue="lunch">
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </label>
        <label>
          When you ate <span className="muted">(Philippine time)</span>
          <input
            required
            type="datetime-local"
            name="localTime"
            defaultValue={now}
            max={now}
          />
        </label>
      </div>
      <label>
        Find foods
        <input
          type="search"
          placeholder="Try kangkong or water spinach"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <FoodTiles
        foods={foods.filter((f) =>
          `${f.filipinoName} ${f.englishName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )}
        selectable
        selected={selected}
        onSelect={(id) =>
          setSelected((old) =>
            old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
          )
        }
      />
      <div className="save-bar">
        <span>{selected.length} foods selected</span>
        <button className="button" disabled={pending || !selected.length}>
          {pending ? "Saving meal…" : "Save meal"}
        </button>
      </div>
      <p role="status" className="form-message">
        {message}
      </p>
    </form>
  );
}
export function DeleteMeal({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <div className="delete-meal">
      <button
        className="icon-button"
        disabled={pending}
        aria-label="Delete meal"
        onClick={() => {
          if (window.confirm("Delete this meal from your log?"))
            start(async () => {
              const result = await deleteMealAction(id);
              setMessage(result.ok ? "" : result.message);
            });
        }}
      >
        <Trash2 size={16} />
      </button>
      {message && <p role="alert">{message}</p>}
    </div>
  );
}
export function ProfileForm({
  profile,
}: {
  profile: {
    name: string;
    email: string;
    region: string | null;
    gender: string | null;
    contactNumber: string | null;
  };
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <form
      className="profile-form"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(async () => {
          const result = await profileAction(Object.fromEntries(data));
          setMessage(result.ok ? "Profile saved." : result.message);
        });
      }}
    >
      <label>
        Name
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={profile.name}
        />
      </label>
      <label>
        Email
        <input value={profile.email} disabled />
        <small>Verified account email</small>
      </label>
      <label>
        Region
        <input
          name="region"
          maxLength={100}
          defaultValue={profile.region || ""}
          placeholder="e.g. Davao Region"
        />
      </label>
      <label>
        Gender <span className="muted">(optional)</span>
        <input
          name="gender"
          maxLength={50}
          defaultValue={profile.gender || ""}
        />
      </label>
      <label>
        Contact number <span className="muted">(optional)</span>
        <input
          name="contactNumber"
          type="tel"
          maxLength={30}
          defaultValue={profile.contactNumber || ""}
        />
      </label>
      <button disabled={pending} className="button">
        {pending ? "Saving…" : "Save profile"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}

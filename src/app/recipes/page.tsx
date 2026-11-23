import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Shell } from "@/components/shell";
export default function Recipes() {
  return (
    <Shell active="Recipes">
      <div className="page-heading">
        <div>
          <h1>Recipes</h1>
          <p>Start with the foods you already enjoy.</p>
        </div>
      </div>
      <div className="empty-meals">
        <BookOpen size={32} />
        <h2>Your recipe space is coming next.</h2>
        <p>
          For now, mark your favorite foods to see color suggestions on your
          daily plate.
        </p>
        <Link href="/foods" className="button">
          Find favorite foods
        </Link>
      </div>
    </Shell>
  );
}

import { Check } from "lucide-react";
import { colours, colourLabels, type Colour } from "@/lib/rainbow";
export function Rainbow({ eaten = [] }: { eaten?: Colour[] }) {
  return (
    <div className="rainbow" aria-label="Today's food colours">
      {colours.map((colour) => (
        <div
          className={`colour-item ${eaten.includes(colour) ? "eaten" : ""}`}
          key={colour}
        >
          <span className={`colour-orb ${colour}`}>
            {eaten.includes(colour) && <Check size={20} strokeWidth={3} />}
          </span>
          <span>{colourLabels[colour]}</span>
          <small>{eaten.includes(colour) ? "Enjoyed" : "To explore"}</small>
        </div>
      ))}
    </div>
  );
}

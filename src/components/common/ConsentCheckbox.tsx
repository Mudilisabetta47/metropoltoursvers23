import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  /** Zusätzlicher Kontext, z.B. "Bewerbung" oder "Anfrage" */
  purpose?: string;
  className?: string;
}

export const CONSENT_TEXT =
  "Ich akzeptiere die AGB und habe die Datenschutzerklärung gelesen. Meine Daten werden zur Bearbeitung gespeichert.";

const ConsentCheckbox = ({
  checked,
  onChange,
  id = "consent",
  purpose = "Anfrage",
  className = "",
}: ConsentCheckboxProps) => (
  <label
    htmlFor={id}
    className={`flex items-start gap-3 text-left cursor-pointer ${className}`}
  >
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
      className="mt-0.5"
      aria-label="AGB und Datenschutzerklärung akzeptieren"
      required
    />
    <span className="text-xs text-muted-foreground leading-relaxed">
      Ich akzeptiere die{" "}
      <Link
        to="/terms"
        target="_blank"
        className="underline text-foreground hover:text-primary"
      >
        AGB
      </Link>{" "}
      und habe die{" "}
      <Link
        to="/privacy"
        target="_blank"
        className="underline text-foreground hover:text-primary"
      >
        Datenschutzerklärung
      </Link>{" "}
      gelesen. Meine Daten werden zur Bearbeitung meiner {purpose} gespeichert
      und nicht an Dritte weitergegeben.
    </span>
  </label>
);

export default ConsentCheckbox;

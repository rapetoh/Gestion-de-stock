"use client";

import { useFormStatus } from "react-dom";

// Bouton de soumission qui se désactive et change de texte pendant l'envoi.
// Évite les doubles soumissions et montre que « ça travaille ».
export default function SubmitButton({
  children,
  pendingLabel = "Enregistrement…",
  className = "btn primary",
  style,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      style={style}
      disabled={pending || disabled}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

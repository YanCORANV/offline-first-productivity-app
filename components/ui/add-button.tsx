import type { ReactNode } from "react";
import { Plus } from "lucide-react";

export function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="primary-button" type="button" onClick={onClick}>
      <Plus size={16} />
      {children}
    </button>
  );
}

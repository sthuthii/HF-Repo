import { useState } from "react";
import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
}

export default function Card({ title, children }: CardProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white shadow-xl rounded-2xl p-4">
      <div
        className="flex justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h2 className="font-bold">{title}</h2>
        <span>{open ? "−" : "+"}</span>
      </div>

      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
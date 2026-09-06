import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  full?: boolean;
}

const base =
  "min-h-[52px] px-6 rounded-card font-body font-semibold text-base sm:text-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<string, string> = {
  primary: "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-900",
  secondary: "bg-white text-teal-700 border-2 border-teal-600 hover:bg-teal-50",
  ghost: "bg-transparent text-teal-700 hover:bg-teal-50 underline underline-offset-4",
};

export default function Button({ variant = "primary", children, full, className = "", ...rest }: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

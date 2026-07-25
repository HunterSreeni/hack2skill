import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed",
  secondary:
    "border border-border bg-transparent hover:bg-black/[.03] dark:hover:bg-white/[.05] disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost: "text-zinc-500 underline hover:text-foreground",
};

const SIZE_CLASSES = {
  md: "h-11 px-5 text-sm rounded-full",
  lg: "h-14 px-6 text-base font-semibold rounded-full",
  sm: "h-9 px-3 text-xs rounded-full",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: keyof typeof SIZE_CLASSES;
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}

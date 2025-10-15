import React from "react";

export function Button({
  children,
  onClick,
  className = "",
  variant = "default",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
}) {
  const base =
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none";
  const variants = {
    default:
      "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}


"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
  secondary: "bg-emerald-500 text-white hover:bg-emerald-600",
  outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
  ghost: "text-slate-600 hover:text-blue-600 hover:bg-slate-100",
} as const;

const baseClasses =
  "px-6 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2";

interface ShaleanButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: keyof typeof variantClasses;
  className?: string;
  children: React.ReactNode;
}

interface ShaleanButtonLinkProps {
  variant?: keyof typeof variantClasses;
  className?: string;
  children: React.ReactNode;
  href: string;
  onClick?: () => void;
}

export function ShaleanButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: ShaleanButtonProps) {
  return (
    <button
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ShaleanButtonLink({
  children,
  variant = "primary",
  className = "",
  href,
  onClick,
}: ShaleanButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

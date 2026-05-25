import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeDate(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays <= 0) return "updated today";
  if (diffDays === 1) return "updated yesterday";
  if (diffDays < 30) return `updated ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "updated 1 month ago";
  if (diffMonths < 12) return `updated ${diffMonths} months ago`;
  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? "updated 1 year ago" : `updated ${diffYears} years ago`;
}

export function zeroPad(n: number, len = 8) {
  return String(n).padStart(len, "0");
}

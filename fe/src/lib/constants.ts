export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export const PROJECT_CATEGORIES = [
  { value: "saas", label: "SaaS" },
  { value: "marketplace", label: "Marketplace" },
  { value: "developer-tool", label: "Developer Tool" },
  { value: "fintech", label: "Fintech" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "e-commerce", label: "E-Commerce" },
  { value: "ai-ml", label: "AI / ML" },
  { value: "mobile-app", label: "Mobile App" },
  { value: "other", label: "Other" },
] as const;

export const PROJECT_STATUSES = [
  { value: "idea", label: "Idea" },
  { value: "prototype", label: "Prototype" },
  { value: "launched", label: "Launched" },
  { value: "scalable", label: "Scalable" },
] as const;

export const MONTHLY_REVENUE_OPTIONS = [
  { value: "pre-revenue", label: "Pre-revenue" },
  { value: "<1k", label: "< €1k / mo" },
  { value: "1k-5k", label: "€1k – €5k / mo" },
  { value: "5k-20k", label: "€5k – €20k / mo" },
  { value: "20k-50k", label: "€20k – €50k / mo" },
  { value: "50k+", label: "> €50k / mo" },
] as const;

export const MONTHLY_USERS_OPTIONS = [
  { value: "<100", label: "< 100 users" },
  { value: "100-1k", label: "100 – 1k users" },
  { value: "1k-10k", label: "1k – 10k users" },
  { value: "10k-50k", label: "10k – 50k users" },
  { value: "50k+", label: "> 50k users" },
] as const;

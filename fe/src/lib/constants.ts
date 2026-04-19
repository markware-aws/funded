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

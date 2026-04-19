// ── Enums ─────────────────────────────────────────────────────────────────────

export type UserRole = "member" | "admin";
export type ReviewStatus = "draft" | "pending_review" | "published" | "rejected";
export type EvaluationStatus = "not_requested" | "pending" | "complete" | "failed";
export type ReadinessLabel = "idea" | "prototype" | "launched" | "scalable";
export type ProjectCategory =
  | "saas" | "marketplace" | "developer-tool" | "fintech" | "health"
  | "education" | "e-commerce" | "ai-ml" | "mobile-app" | "other";
export type ProjectStatus = "idea" | "prototype" | "launched" | "scalable";

// ── Evaluation ────────────────────────────────────────────────────────────────

export interface EvaluationDimension {
  score: number;
  reasoning: string;
}

export interface EvaluationScores {
  problemClarity: EvaluationDimension;
  originality: EvaluationDimension;
  completenessDeployment: EvaluationDimension;
  commercialViability: EvaluationDimension;
  presentationQuality: EvaluationDimension;
}

export interface Evaluation {
  requestedAt: string;
  completedAt: string;
  scores: EvaluationScores;
  totalScore: number;
  summary: string;
  strongestSignal: string;
  biggestGap: string;
  readinessLabel: ReadinessLabel;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  hasProject: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  hasProject: boolean;
}

// ── Project ───────────────────────────────────────────────────────────────────

export interface Project {
  projectId: string;
  userId: string;
  name: string;
  tagline: string;
  description: string;
  vision: string;
  features: string[];
  websiteUrl: string;
  githubUrl?: string;
  githubStars?: number;
  githubLastUpdated?: string;
  contactEmail: string;
  contactNote?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  likeCount: number;
  likedByMe?: boolean;
  reviewStatus: ReviewStatus;
  evaluationStatus: EvaluationStatus;
  evaluation?: Evaluation;
  screenshotUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  tagline: string;
  description: string;
  vision: string;
  features: string[];
  websiteUrl: string;
  githubUrl?: string;
  contactEmail: string;
  contactNote?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  screenshotUrl?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

// ── API ───────────────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST" | "INTERNAL_ERROR"
  | "MUST_HAVE_PROJECT" | "NOT_OWNER" | "EVALUATION_ALREADY_REQUESTED"
  | "PROJECT_NOT_PUBLISHED" | "ADMIN_ONLY";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export interface Pagination {
  nextCursor: string | null;
  limit: number;
}


export interface ProjectsListResponse {
  projects: Project[];
  pagination: Pagination;
}

import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError, fetcher } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { Project, User } from "@/types";

const REVIEW_LABELS: Record<Project["reviewStatus"], string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
};

const REVIEW_STYLES: Record<Project["reviewStatus"], string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_review: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function getLock(project: Project) {
  const lockUntil = project.evaluationLockedUntil ? new Date(project.evaluationLockedUntil) : null;
  const isLocked = !!lockUntil && lockUntil > new Date();
  const lockDaysLeft = isLocked && lockUntil
    ? Math.ceil((lockUntil.getTime() - Date.now()) / 86_400_000)
    : 0;
  return { lockUntil, isLocked, lockDaysLeft };
}

function evaluationLabel(project: Project) {
  const { isLocked, lockDaysLeft } = getLock(project);
  if (project.evaluationStatus === "pending") {
    return "Evaluation will be available shortly, please check back in a few minutes.";
  }
  if (project.evaluationStatus === "failed") return "Evaluation failed. Retry is available.";
  if (project.evaluationStatus === "complete" && isLocked) {
    return `Score ${project.evaluation?.totalScore ?? "-"}/100. Locked for ${lockDaysLeft} more ${lockDaysLeft === 1 ? "day" : "days"}.`;
  }
  if (project.evaluationStatus === "complete") {
    return `Score ${project.evaluation?.totalScore ?? "-"}/100. Re-evaluation is available.`;
  }
  if (project.reviewStatus === "published") return "AI evaluation is available.";
  return "Available after publication.";
}

function nextAction(project: Project) {
  const { isLocked } = getLock(project);
  if (isLocked) return "Locked";
  if (project.reviewStatus === "draft") return "Submit for review";
  if (project.reviewStatus === "pending_review") return "Await admin review";
  if (project.reviewStatus === "rejected") return "Edit and resubmit";
  if (project.evaluationStatus === "not_requested") return "Request evaluation";
  if (project.evaluationStatus === "failed") return "Retry evaluation";
  if (project.evaluationStatus === "pending") return "Evaluation pending";
  return "Manage project";
}

interface ProjectRowProps {
  project: Project;
  onDelete: (project: Project) => Promise<void>;
  onEvaluate: (project: Project) => Promise<void>;
  onSubmitDraft: (project: Project) => Promise<void>;
  busyProjectId: string | null;
}

function ProjectManagementRow({
  project,
  onDelete,
  onEvaluate,
  onSubmitDraft,
  busyProjectId,
}: ProjectRowProps) {
  const { lockUntil, isLocked } = getLock(project);
  const busy = busyProjectId === project.projectId;
  const canEvaluate = project.reviewStatus === "published"
    && !isLocked
    && ["not_requested", "failed", "complete"].includes(project.evaluationStatus);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Link href={`/projects/${project.slug}`} className="font-semibold text-gray-900 hover:text-brand-600">
              {project.name}
            </Link>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", REVIEW_STYLES[project.reviewStatus])}>
              {REVIEW_LABELS[project.reviewStatus]}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
              {project.reviewStatus === "published" ? "Public" : "Private"}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-gray-500">{project.tagline}</p>
          <div className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
            <div>
              <span className="font-medium text-gray-700">Evaluation:</span> {evaluationLabel(project)}
            </div>
            <div>
              <span className="font-medium text-gray-700">Next action:</span> {nextAction(project)}
            </div>
            {lockUntil && isLocked && (
              <div>
                <span className="font-medium text-gray-700">Unlocks:</span> {formatDate(lockUntil.toISOString())}
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Updated:</span> {formatDate(project.updatedAt)}
            </div>
          </div>
          {project.rejectionReason && (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">Admin feedback:</span> {project.rejectionReason}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            href={`/projects/${project.slug}`}
            className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            View
          </Link>
          {!isLocked && (
            <Link
              href={`/projects/${project.slug}?action=edit`}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Edit
            </Link>
          )}
          {project.reviewStatus === "draft" && !isLocked && (
            <button
              onClick={() => onSubmitDraft(project)}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Submitting..." : "Submit"}
            </button>
          )}
          {canEvaluate && (
            <button
              onClick={() => onEvaluate(project)}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Requesting..." : project.evaluationStatus === "failed" ? "Retry Evaluation" : project.evaluationStatus === "complete" ? "Re-evaluate" : "Evaluate"}
            </button>
          )}
          {!isLocked && (
            <button
              onClick={() => onDelete(project)}
              disabled={busy}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, reload } = useAuth();
  const tab = (router.query.tab as string) ?? "projects";
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [projectError, setProjectError] = useState("");

  const { data: myProjects, mutate: mutateProjects } = useSWR<Project[]>(
    isAuthenticated && !!user?.userId && tab === "projects"
      ? `/users/${user.userId}/projects`
      : null,
    fetcher,
  );
  const { data: savedProjects, mutate: mutateSavedProjects } = useSWR<Project[]>(
    isAuthenticated && tab === "saved" ? "/users/me/saved-projects" : null,
    fetcher,
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/signin?returnUrl=/profile");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name,
        githubUrl: user.githubUrl,
        websiteUrl: user.websiteUrl,
        twitterUrl: user.twitterUrl,
        linkedinUrl: user.linkedinUrl,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      });
    }
  }, [user]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <Layout>
        <div className="py-24 text-center text-gray-400">Loading...</div>
      </Layout>
    );
  }

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/users/me", editForm);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const handleProjectError = (err: unknown) => {
    if (err instanceof ApiClientError) {
      if ((err.error as any).code === "PROJECT_LOCKED") {
        setProjectError(err.error.message);
      } else {
        setProjectError(err.error.message);
      }
    } else {
      setProjectError(err instanceof Error ? err.message : "Project action failed.");
    }
  };

  const submitDraft = async (project: Project) => {
    setProjectError("");
    setBusyProjectId(project.projectId);
    try {
      await api.post(`/projects/${project.projectId}/submit`, {});
      await mutateProjects();
    } catch (err) {
      handleProjectError(err);
    } finally {
      setBusyProjectId(null);
    }
  };

  const requestEvaluation = async (project: Project) => {
    setProjectError("");
    setBusyProjectId(project.projectId);
    try {
      await api.post(`/projects/${project.projectId}/evaluate`, {});
      await mutateProjects((projects) =>
        projects?.map((p) =>
          p.projectId === project.projectId ? { ...p, evaluationStatus: "pending" } : p,
        ),
        false,
      );
    } catch (err) {
      handleProjectError(err);
    } finally {
      setBusyProjectId(null);
    }
  };

  const deleteProject = async (project: Project) => {
    const typedName = window.prompt(`Type ${project.name} to delete this project.`);
    if (typedName !== project.name) return;
    setProjectError("");
    setBusyProjectId(project.projectId);
    try {
      await api.delete(`/projects/${project.projectId}`);
      await mutateProjects((projects) => projects?.filter((p) => p.projectId !== project.projectId), false);
    } catch (err) {
      handleProjectError(err);
      await mutateProjects();
    } finally {
      setBusyProjectId(null);
    }
  };

  const field = "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <Layout>
      <Head>
        <title>Profile - funded.gr</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold mb-6">{user.name}</h1>

        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {["projects", "saved", "settings"].map((t) => (
            <button
              key={t}
              onClick={() => router.push({ query: { tab: t } })}
              className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "projects" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Projects</h2>
              <Link
                href="/submit"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700"
              >
                Submit Project
              </Link>
            </div>
            {projectError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {projectError}
              </div>
            )}
            {!myProjects?.length ? (
              <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center">
                <p className="text-gray-500 text-sm mb-4">You have not submitted any projects yet.</p>
                <Link
                  href="/submit"
                  className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Submit your first project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myProjects.map((p) => (
                  <ProjectManagementRow
                    key={p.projectId}
                    project={p}
                    onDelete={deleteProject}
                    onEvaluate={requestEvaluation}
                    onSubmitDraft={submitDraft}
                    busyProjectId={busyProjectId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "saved" && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Saved Projects</h2>
              <p className="mt-1 text-sm text-gray-500">Projects you saved for later.</p>
            </div>
            {!savedProjects?.length ? (
              <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center">
                <p className="text-gray-500 text-sm mb-4">No saved projects yet.</p>
                <Link
                  href="/projects"
                  className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Browse projects
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedProjects.map((p) => (
                  <div key={p.projectId} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link href={`/projects/${p.slug}`} className="font-semibold text-gray-900 hover:text-brand-600">
                        {p.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{p.tagline}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await api.delete(`/projects/${p.projectId}/like/save`);
                        await mutateSavedProjects((projects) => projects?.filter((project) => project.projectId !== p.projectId), false);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                className={`${field} min-h-24 resize-none`}
                value={editForm.bio ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, bio: e.target.value }))
                }
                placeholder="Short founder bio, focus area, or what you are building."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                className={field}
                value={editForm.name ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
              </label>
              <input
                className={field}
                type="url"
                value={editForm.avatarUrl ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, avatarUrl: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                className={field}
                type="url"
                value={editForm.websiteUrl ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub URL
              </label>
              <input
                className={field}
                type="url"
                value={editForm.githubUrl ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, githubUrl: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                X/Twitter URL
              </label>
              <input
                className={field}
                type="url"
                value={editForm.twitterUrl ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, twitterUrl: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                className={field}
                type="url"
                value={editForm.linkedinUrl ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, linkedinUrl: e.target.value }))
                }
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

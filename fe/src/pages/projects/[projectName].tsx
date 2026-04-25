import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { ArrowLeft, Heart, ExternalLink, Github, Star, Mail, Calendar, Lock } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { EvaluationPanel } from "@/components/projects/EvaluationPanel";
import { useProject } from "@/hooks/useProject";
import { useLike } from "@/hooks/useLike";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { UpdateProjectInput } from "@/types";

export default function ProjectDetailPage() {
  const router = useRouter();
  const slug = router.query.projectName as string;
  const action = router.query.action as string | undefined;
  const { data: project, isLoading, mutate } = useProject(slug);
  const { user, isAuthenticated } = useAuth();
  const { toggle } = useLike(slug, project?.projectId ?? "");
  const [evalRequested, setEvalRequested] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="py-24 text-center text-gray-400 text-sm">
          {isLoading ? "Loading…" : "Project not found."}
        </div>
      </Layout>
    );
  }

  const isOwner = user?.userId === project.userId;
  const canLike = isAuthenticated && !!user?.hasProject && !isOwner;

  const lockUntil = project.evaluationLockedUntil ? new Date(project.evaluationLockedUntil) : null;
  const isLocked = !!lockUntil && lockUntil > new Date();
  const lockDaysLeft = isLocked && lockUntil
    ? Math.ceil((lockUntil.getTime() - Date.now()) / 86_400_000)
    : 0;

  if (action === "edit" && isOwner) {
    const isDraft = project.reviewStatus === "draft";

    const handleSaveDraft = async (input: UpdateProjectInput) => {
      await api.put(`/projects/${project.projectId}`, input);
      router.replace(`/projects/${project.slug}`);
      mutate();
    };

    const handleSubmit = async (input: UpdateProjectInput) => {
      await api.put(`/projects/${project.projectId}`, input);
      if (isDraft) await api.post(`/projects/${project.projectId}/submit`, {});
      router.replace(`/projects/${project.slug}`);
      mutate();
    };

    return (
      <Layout>
        <Head><title>Edit {project.name} — funded.gr</title></Head>
        <div>
          <h1 className="text-2xl font-bold mb-6 tracking-tight">Edit Project</h1>
          <ProjectForm
            initial={project}
            onSubmit={handleSubmit}
            onSaveDraft={isDraft ? handleSaveDraft : undefined}
            submitLabel={isDraft ? "Submit for Review" : "Save Changes"}
          />
        </div>
      </Layout>
    );
  }

  const requestEvaluation = async () => {
    await api.post(`/projects/${project.projectId}/evaluate`, {});
    setEvalRequested(true);
    setShowEvalModal(false);
  };

  return (
    <Layout>
      <Head><title>{project.name} — funded.gr</title></Head>

      {/* Review status banner */}
      {isOwner && project.reviewStatus !== "published" && (
        <div className={cn(
          "mb-6 rounded-xl px-5 py-4 text-sm font-medium",
          project.reviewStatus === "draft"
            ? "bg-gray-50 text-gray-700 border border-gray-200"
            : project.reviewStatus === "pending_review"
            ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
            : "bg-red-50 text-red-800 border border-red-200"
        )}>
          {project.reviewStatus === "draft"
            ? "This project is saved as a draft. Submit it for review when ready."
            : project.reviewStatus === "pending_review"
            ? "Your project is under review. It will appear publicly once approved."
            : "Your project was rejected. Edit it and resubmit for review."}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border rounded-2xl mb-8">
        <div className="px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex justify-between items-start gap-8 mb-5">
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-4xl tracking-tight text-gray-800 mb-2">{project.name}</h1>
              <p className="text-lg text-gray-600 leading-relaxed">{project.tagline}</p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              {project.evaluation && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">AI Score</div>
                  <div className="text-2xl font-bold text-gray-800 font-mono">{project.evaluation.totalScore}<span className="text-sm text-gray-400">/100</span></div>
                </div>
              )}
              <div className="h-10 w-px bg-gray-200" />
              <button
                onClick={() => toggle(!!project.likedByMe, project.likeCount)}
                disabled={!canLike}
                title={canLike ? undefined : "Submit your own project to like others"}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition",
                  project.likedByMe ? "text-red-600" : "text-gray-500 hover:text-red-600",
                  !canLike && "opacity-50 cursor-not-allowed"
                )}
              >
                <Heart className={cn("w-5 h-5", project.likedByMe && "fill-current")} />
                <span className="font-semibold">{project.likeCount}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">{project.category}</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">{project.status}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="font-mono">
                {new Date(project.createdAt).toLocaleDateString("el-GR", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            {project.githubStars !== undefined && (
              <>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-current text-gray-400" />
                  <span className="font-mono">{project.githubStars} stars</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot */}
      {project.screenshotUrl && (
        <div className="mb-10 flex justify-center bg-gray-50 border rounded-2xl overflow-hidden">
          <img
            src={project.screenshotUrl}
            alt={`${project.name} screenshot`}
            className="w-full max-h-[480px] object-cover object-top"
            onError={(e) => { e.currentTarget.parentElement!.style.display = "none"; }}
          />
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Main */}
        <div className="lg:col-span-3 space-y-10">
          {project.vision && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-800">Vision</h2>
              <p className="text-gray-600 leading-relaxed text-lg">{project.vision}</p>
            </div>
          )}

          {project.description && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-800">About</h2>
              <p className="text-gray-600 leading-relaxed">{project.description}</p>
            </div>
          )}

          {project.features.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-5 text-gray-800">Key Features</h2>
              <div className="space-y-3">
                {project.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="text-blue-600 mt-1 font-bold">•</span>
                    <p className="leading-relaxed">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.evaluationStatus === "complete" && project.evaluation && (
            <EvaluationPanel evaluation={project.evaluation} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div>
            <h3 className="font-bold mb-4 text-gray-800">Links</h3>
            <div className="space-y-2">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm">
                  <Github className="w-4 h-4" /> GitHub
                </a>
              )}
              {project.websiteUrl && (
                <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm">
                  <ExternalLink className="w-4 h-4" /> Website
                </a>
              )}
              <a href={`mailto:${project.contactEmail}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm">
                <Mail className="w-4 h-4" /> Contact
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <a
              href={`mailto:${project.contactEmail}`}
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium text-sm"
            >
              Contact Founder
            </a>
            {project.contactNote && (
              <p className="text-xs text-gray-500 mt-2 text-center italic">{project.contactNote}</p>
            )}
          </div>

          {isOwner && (
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Your Project</p>

              {isLocked ? (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                  <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Locked for {lockDaysLeft} more {lockDaysLeft === 1 ? "day" : "days"} after evaluation. Editing and deletion are disabled.</span>
                </div>
              ) : (
                <button
                  onClick={() => router.push(`/projects/${project.slug}?action=edit`)}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Edit Project
                </button>
              )}

              {project.reviewStatus === "published" && (
                <>
                  {project.evaluationStatus === "not_requested" && !evalRequested && (
                    <button onClick={() => setShowEvalModal(true)}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-blue-700 transition">
                      Get AI Evaluation
                    </button>
                  )}
                  {(project.evaluationStatus === "pending" || evalRequested) && (
                    <p className="text-xs text-gray-500 text-center">Evaluation requested — results available shortly.</p>
                  )}
                  {project.evaluationStatus === "failed" && !evalRequested && (
                    <button onClick={() => setShowEvalModal(true)}
                      className="w-full rounded-lg border border-orange-300 px-4 py-2.5 text-sm text-orange-600 font-medium hover:bg-orange-50 transition">
                      Retry Evaluation
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {showEvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Request AI Evaluation</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              The AI will score your project across 5 dimensions and assign a readiness label based on your submission data.
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 mb-6">
              <strong>Before you confirm:</strong> once the evaluation is complete, your project will be <strong>locked for 30 days</strong>. You will not be able to edit or delete it during this period.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEvalModal(false)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={requestEvaluation}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-blue-700 transition"
              >
                Confirm & Evaluate
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

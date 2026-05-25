import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { Project } from "@/types";

const REJECTION_TEMPLATES = [
  {
    label: "Needs clearer problem",
    reason: "Please clarify the problem your project solves, who it is for, and why that audience needs this solution.",
  },
  {
    label: "Insufficient product detail",
    reason: "Please add more concrete product details, including key workflows, features, and what is already working today.",
  },
  {
    label: "Missing proof links",
    reason: "Please add a working website, demo, screenshot, or GitHub repository so reviewers can verify the project.",
  },
  {
    label: "Presentation quality",
    reason: "Please improve the submission copy so it is specific, credible, and understandable to founders and potential collaborators.",
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { projects, approve, reject, isLoading: queueLoading } = useAdminQueue();
  const [rejecting, setRejecting] = useState<Project | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <Layout>
        <div className="py-24 text-center text-gray-400">Loading...</div>
      </Layout>
    );
  }

  const confirmApprove = async (project: Project) => {
    if (!window.confirm(`Approve "${project.name}" and publish it publicly?`)) return;
    setActionError("");
    setSubmitting(true);
    try {
      await approve(project.projectId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not approve project.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setActionError("Rejection reason is required.");
      return;
    }
    if (!window.confirm(`Reject "${rejecting.name}" and send this feedback to the owner?`)) return;
    setActionError("");
    setSubmitting(true);
    try {
      await reject(rejecting.projectId, reason);
      setRejecting(null);
      setRejectReason("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not reject project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Admin - funded.gr</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold mb-6">Review Queue</h1>

        {actionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {queueLoading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Queue is empty.</div>
        ) : (
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.projectId} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/projects/${p.projectId}`}
                      className="font-semibold text-gray-900 hover:text-brand-600"
                    >
                      {p.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">{p.tagline}</p>
                    <div className="flex gap-2 mt-2 text-xs text-gray-400">
                      <span>{p.category}</span>
                      <span>-</span>
                      <span>{p.status}</span>
                      <span>-</span>
                      <span>Submitted {formatDate(p.createdAt)}</span>
                    </div>
                    {p.websiteUrl && (
                      <a
                        href={p.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:underline mt-1 inline-block"
                      >
                        {p.websiteUrl}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => confirmApprove(p)}
                      disabled={submitting}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejecting(p);
                        setRejectReason("");
                        setActionError("");
                      }}
                      disabled={submitting}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Reject {rejecting.name}</h2>
            <p className="mt-1 text-sm text-gray-500">
              This feedback is shown privately to the project owner.
            </p>
            <textarea
              className="mt-4 min-h-32 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain what needs to change before this project can be published."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {REJECTION_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => setRejectReason(template.reason)}
                  className="rounded-full border px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {template.label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setRejecting(null);
                  setRejectReason("");
                  setActionError("");
                }}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={submitting || !rejectReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Rejecting..." : "Reject Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

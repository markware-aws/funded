import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { ExternalLink, Github, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { api, fetcher } from "@/lib/api";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Project, User } from "@/types";

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

interface AdminProjectResponse {
  project: Project;
  owner?: User;
}

export default function AdminProjectDetailPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string | undefined;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data, isLoading: projectLoading, mutate } = useSWR<AdminProjectResponse>(
    projectId ? `/admin/projects/${projectId}` : null,
    fetcher,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
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

  if (projectLoading || !data) {
    return (
      <Layout>
        <div className="py-24 text-center text-gray-400">
          {projectLoading ? "Loading..." : "Project not found."}
        </div>
      </Layout>
    );
  }

  const { project, owner } = data;
  const githubUpdated = formatRelativeDate(project.githubLastUpdated);

  const approve = async () => {
    if (!window.confirm(`Approve "${project.name}" and publish it publicly?`)) return;
    setError("");
    setSubmitting(true);
    try {
      await api.put(`/admin/projects/${project.projectId}/approve`, {});
      await mutate();
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve project.");
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Rejection reason is required.");
      return;
    }
    if (!window.confirm(`Reject "${project.name}" and send this feedback to the owner?`)) return;
    setError("");
    setSubmitting(true);
    try {
      await api.put(`/admin/projects/${project.projectId}/reject`, { reason });
      await mutate();
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Review {project.name} - funded.gr</title>
      </Head>

      <div className="mb-6">
        <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-gray-800">
          Back to review queue
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <main className="lg:col-span-2 space-y-8">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 font-medium text-yellow-800">
                {project.reviewStatus}
              </span>
              <span>{project.category}</span>
              <span>-</span>
              <span>{project.status}</span>
              <span>-</span>
              <span>Submitted {formatDate(project.createdAt)}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{project.name}</h1>
            <p className="mt-2 text-lg text-gray-600">{project.tagline}</p>
          </section>

          {project.screenshotUrl && (
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <img
                src={project.screenshotUrl}
                alt={`${project.name} screenshot`}
                className="max-h-[520px] w-full object-cover object-top"
              />
            </section>
          )}

          <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Vision</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{project.vision}</p>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{project.description}</p>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Features</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                {project.features.map((feature, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-blue-600">-</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Founder</h2>
            <p className="font-medium text-gray-900">{owner?.name ?? "Unknown founder"}</p>
            {owner?.email && <p className="mt-1 text-sm text-gray-500">{owner.email}</p>}
            {owner?.bio && <p className="mt-3 text-sm leading-relaxed text-gray-600">{owner.bio}</p>}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Links</h2>
            <div className="space-y-3 text-sm">
              {project.websiteUrl && (
                <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> Website
                </a>
              )}
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline">
                  <Github className="h-4 w-4" /> GitHub
                  {project.githubStars !== undefined && <span className="text-gray-500">({project.githubStars} stars{githubUpdated ? `, ${githubUpdated}` : ""})</span>}
                </a>
              )}
              <a href={`mailto:${project.contactEmail}`} className="flex items-center gap-2 text-brand-600 hover:underline">
                <Mail className="h-4 w-4" /> {project.contactEmail}
              </a>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Traction</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">Revenue:</span> {project.monthlyRevenue ?? "Not disclosed"}</p>
              <p><span className="font-medium text-gray-800">Users:</span> {project.monthlyUsers ?? "Not disclosed"}</p>
              <p><span className="font-medium text-gray-800">Contact note:</span> {project.contactNote ?? "None"}</p>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Review Decision</h2>
            <div className="flex gap-2">
              <button
                onClick={approve}
                disabled={submitting}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={reject}
                disabled={submitting || !rejectReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
            <textarea
              className="mt-4 min-h-32 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Required when rejecting."
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
          </section>
        </aside>
      </div>
    </Layout>
  );
}

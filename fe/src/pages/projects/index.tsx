import Head from "next/head";
import { useRouter } from "next/router";
import { Layout } from "@/components/layout/Layout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useProjects } from "@/hooks/useProjects";
import { useLike } from "@/hooks/useLike";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CreateProjectInput, Project } from "@/types";

const SORT_OPTIONS = [
  { value: "likes", label: "Most Liked" },
  { value: "score", label: "Top Scored" },
  { value: "recent", label: "Most Recent" },
];

function ProjectItem({ project }: { project: Project }) {
  const { user, isAuthenticated } = useAuth();
  const { toggle } = useLike(project.slug, project.projectId);
  return (
    <ProjectCard
      project={project}
      canLike={isAuthenticated && !!user?.hasProject}
      onLike={() => toggle(!!project.likedByMe, project.likeCount)}
    />
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const action = router.query.action as string | undefined;
  const sort = (router.query.sort as string) ?? "likes";
  const category = router.query.category as string | undefined;
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useProjects(sort as any, category);

  const createOrRedirect = async (input: CreateProjectInput): Promise<Project> => {
    try {
      return await api.post<Project>("/projects", input);
    } catch (err) {
      if (err instanceof ApiClientError && (err.error as any).code === "PROJECT_LIMIT_REACHED") {
        router.push("/profile");
        throw err;
      }
      throw err;
    }
  };

  const handleSaveDraft = async (input: CreateProjectInput) => {
    const project = await createOrRedirect(input);
    router.push("/profile");
  };

  const handleCreate = async (input: CreateProjectInput) => {
    const project = await createOrRedirect(input);
    await api.post(`/projects/${(project as any).projectId}/submit`, {});
    router.push(`/projects/${(project as any).slug ?? ""}`);
  };

  if (action === "new") {
    if (!isAuthenticated) {
      router.replace("/auth/signin?returnUrl=" + encodeURIComponent("/projects?action=new"));
      return null;
    }
    return (
      <Layout>
        <Head><title>Submit Project — funded.gr</title></Head>
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="font-bold text-4xl mb-2 tracking-tight text-gray-800">Submit Your Project</h1>
          <p className="text-lg text-gray-600 mb-8">Share your work with the Greek founders community</p>
          <ProjectForm onSubmit={handleCreate} onSaveDraft={handleSaveDraft} onCancel={() => router.back()} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head><title>Projects — funded.gr</title></Head>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="font-bold text-2xl tracking-tight">All Projects</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <select
            className="rounded-lg border px-3 py-2 text-sm bg-white hover:bg-gray-50 transition font-medium"
            value={category ?? ""}
            onChange={(e) => router.push({ query: { ...router.query, category: e.target.value || undefined } })}
          >
            <option value="">All Categories</option>
            {PROJECT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          {/* Sort buttons */}
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => router.push({ query: { ...router.query, sort: o.value } })}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm",
                sort === o.value
                  ? "bg-blue-600 text-white"
                  : "bg-white border hover:bg-gray-50"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
      ) : data?.projects.length === 0 ? (
        <div className="text-center text-gray-400 py-16 text-sm">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data?.projects.map((p) => <ProjectItem key={p.projectId} project={p} />)}
        </div>
      )}
    </Layout>
  );
}

import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import { useLike } from "@/hooks/useLike";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Project } from "@/types";

const SORT_OPTIONS = [
  { value: "likes", label: "Most Liked", description: "Projects ranked by community likes." },
  { value: "score", label: "Top Scored", description: "Projects ranked by completed AI evaluation score." },
  { value: "recent", label: "Most Recent", description: "Newest approved projects first." },
];

function ProjectItem({ project }: { project: Project }) {
  const { user, isAuthenticated } = useAuth();
  const { toggle } = useLike(project.slug, project.projectId);
  const toggleSave = async () => {
    if (project.savedByMe) await api.delete(`/projects/${project.projectId}/like/save`);
    else await api.post(`/projects/${project.projectId}/like/save`, {});
  };
  return (
    <ProjectCard
      project={project}
      canLike={isAuthenticated && !!user?.hasProject}
      canSave={isAuthenticated}
      onLike={() => toggle(!!project.likedByMe, project.likeCount)}
      onSave={toggleSave}
    />
  );
}

export default function Projects() {
  const router = useRouter();
  const action = router.query.action as string | undefined;
  const sort = (router.query.sort as string) ?? "likes";
  const category = router.query.category as string | undefined;
  const { data, isLoading } = useProjects(sort as any, category);
  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0];

  useEffect(() => {
    if (action === "new") {
      router.replace("/submit");
    }
  }, [action, router]);

  if (action === "new") {
    return <Layout><div className="py-24 text-center text-gray-400">Redirecting...</div></Layout>;
  }

  return (
    <Layout>
      <Head>
        <title>Projects — funded.gr</title>
        <meta name="description" content="Discover and support the best Greek startups and indie projects." />
        <link rel="canonical" href="https://funded.gr/projects" />
      </Head>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="font-bold text-2xl tracking-tight">All Projects</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border px-3 py-2 text-sm bg-white hover:bg-gray-50 transition font-medium"
            value={category ?? ""}
            onChange={(e) => router.push({ query: { ...router.query, category: e.target.value || undefined } })}
          >
            <option value="">All Categories</option>
            {PROJECT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

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
      <p className="mb-6 max-w-2xl text-sm text-gray-500">
        <span className="font-medium text-gray-700">{activeSort.label}:</span> {activeSort.description}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">No projects found.</p>
          {(category || sort !== "likes") && (
            <button
              onClick={() => router.push("/projects")}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data?.projects.map((p) => <ProjectItem key={p.projectId} project={p} />)}
        </div>
      )}
    </Layout>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="bg-white border rounded-xl overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-100" />
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-full bg-gray-100 rounded mb-1" />
        <div className="h-4 w-2/3 bg-gray-100 rounded mb-4" />
        <div className="h-16 bg-gray-50 rounded-lg mb-4" />
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-5/6 bg-gray-100 rounded" />
          <div className="h-3 w-4/6 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2 mb-4">
          <div className="h-8 w-20 bg-gray-100 rounded-lg" />
          <div className="h-8 w-24 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex justify-between pt-4 border-t">
          <div className="h-4 w-16 bg-gray-100 rounded-full" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

import Head from "next/head";
import Link from "next/link";
import { Rocket, TrendingUp, Users } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import { useLike } from "@/hooks/useLike";
import { useAuth } from "@/hooks/useAuth";
import { Project } from "@/types";

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

export default function Home() {
  const { data, isLoading } = useProjects("likes");
  const projects = data?.projects ?? [];

  const stats = {
    total: projects.length,
    totalLikes: projects.reduce((s, p) => s + p.likeCount, 0),
    evaluated: projects.filter((p) => p.evaluationStatus === "complete").length,
  };

  return (
    <Layout>
      <Head><title>funded.gr — Greek Startup Showcase</title></Head>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Rocket className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Projects</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
        </div>
        <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Likes</span>
          </div>
          <p className="text-3xl font-bold tracking-tight font-mono">{stats.totalLikes}</p>
        </div>
        <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Evaluated</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">{stats.evaluated}</p>
        </div>
      </div>

      {/* Projects */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl tracking-tight">Top Projects</h2>
        <Link href="/projects" className="text-sm text-blue-600 hover:underline font-medium">
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No projects yet. Be the first to submit!</p>
          <Link
            href="/projects?action=new"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm"
          >
            Add Your Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.slice(0, 6).map((p) => (
            <ProjectItem key={p.projectId} project={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}

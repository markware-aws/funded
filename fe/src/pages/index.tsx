import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import {
  Code2,
  TrendingUp,
  Users,
  Rocket,
  ArrowRight,
  Github,
  Star,
  Heart,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import { useLike } from "@/hooks/useLike";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { Project } from "@/types";

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

export default function Home() {
  const { data, isLoading } = useProjects("recent");

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`).catch(() => {});
  }, []);

  const recentProjects = data?.projects.slice(0, 3) ?? [];

  return (
    <Layout>
      <Head>
        <title>funded.gr — Greek Startup Showcase</title>
        <meta
          name="description"
          content="Showcase your Greek startup, receive AI evaluations, and connect with founders, investors, and collaborators."
        />
        <link rel="canonical" href="https://funded.gr/" />
      </Head>
      {/* Hero */}
      <div className="text-center max-w-4xl mx-auto py-16 md:py-20">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
            <Code2 className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="font-bold text-5xl sm:text-6xl mb-6 tracking-tight text-gray-800">
          Greek Founders Hub
        </h1>
        <p className="text-2xl text-gray-600 mb-4 leading-relaxed">
          Ελληνική κοινότητα καινοτομίας
        </p>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Showcase your projects, receive community evaluations, and connect
          with Greek founders, investors, and collaborators.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/projects"
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg font-semibold text-lg"
          >
            Browse Projects
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/submit"
            className="flex items-center gap-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-lg"
          >
            Submit Your Project
          </Link>
        </div>
      </div>
      {/* Stats — full-width breakout
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 bg-white border-y border-gray-200/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Rocket className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">100+</div>
              <div className="text-gray-600">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">€10M+</div>
              <div className="text-gray-600">Combined Valuation</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">500+</div>
              <div className="text-gray-600">Community Members</div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Features */}
      <div className="p-16">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl mb-4 tracking-tight text-gray-800">
            Why Join Greek Founders Hub?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A platform designed by founders, for founders. Build in public and
            grow together.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition">
            <div className="p-3 bg-blue-50 rounded-lg w-fit mb-4">
              <Code2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Showcase Your Work
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Present your projects with detailed descriptions, screenshots, and
              GitHub integration. Stand out in the Greek tech ecosystem.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition">
            <div className="p-3 bg-green-50 rounded-lg w-fit mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Get AI Evaluations
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Receive comprehensive AI-powered project evaluations across
              technical quality, originality, and commercial viability.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition">
            <div className="p-3 bg-purple-50 rounded-lg w-fit mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Community Support
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Connect with fellow Greek founders. Share feedback, collaborate,
              and support each other's ventures.
            </p>
          </div>
          {/* <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition">
            <div className="p-3 bg-yellow-50 rounded-lg w-fit mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Track Progress
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Monitor your project's popularity with likes and track GitHub
              stars. See how your work resonates with the community.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition">
            <div className="p-3 bg-red-50 rounded-lg w-fit mb-4">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              Find Opportunities
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Attract investors, collaborators, and potential acquirers. Make it
              easy for others to discover and contact you.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition">
            <div className="p-3 bg-indigo-50 rounded-lg w-fit mb-4">
              <Github className="w-6 h-6 text-gray-800" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-800">
              GitHub Integration
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Link your repositories and display real-time star counts. Show the
              technical depth behind your projects.
            </p>
          </div> */}
        </div>
      </div>
      {/* CTA — full-width breakout */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-y border-blue-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-bold text-4xl mb-6 tracking-tight text-gray-800">
            Ready to Share Your Project?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join the growing community of Greek innovators and entrepreneurs
            building the future.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/submit"
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg font-semibold text-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-lg"
            >
              Browse Projects
            </Link>
          </div>
        </div>
      </div>
      {/* Most Recent */}
      <div className="py-16">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="font-bold text-2xl tracking-tight">Most Recent</h2>
          <Link
            href="/projects?sort=recent"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              No projects yet. Be the first to submit!
            </p>
            <Link
              href="/submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm"
            >
              Add Your Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recentProjects.map((p) => (
              <ProjectItem key={p.projectId} project={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

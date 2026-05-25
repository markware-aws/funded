import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiClientError } from "@/lib/api";
import { CreateProjectInput, Project } from "@/types";

export default function SubmitPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/signin?returnUrl=/submit");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <Layout><div className="py-24 text-center text-gray-400">Loading…</div></Layout>;
  }

  const handleSaveDraft = async (input: CreateProjectInput) => {
    try {
      await api.post<Project>("/projects", input);
      router.push("/profile");
    } catch (err) {
      if (err instanceof ApiClientError && (err.error as any).code === "PROJECT_LIMIT_REACHED") {
        setLimitReached(true);
      }
      throw err;
    }
  };

  const handleCreate = async (input: CreateProjectInput) => {
    try {
      const project = await api.post<Project>("/projects", input);
      await api.post(`/projects/${(project as any).projectId}/submit`, {});
      router.push(`/projects/${(project as any).slug}`);
    } catch (err) {
      if (err instanceof ApiClientError && (err.error as any).code === "PROJECT_LIMIT_REACHED") {
        setLimitReached(true);
      }
      throw err;
    }
  };

  return (
    <Layout>
      <Head><title>Submit Project — funded.gr</title></Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Project</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your project will be reviewed before appearing publicly. Once approved you can request an AI evaluation.
        </p>
        {limitReached && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You have reached the maximum of 5 projects.{" "}
            <Link href="/profile" className="font-semibold underline">
              Manage your existing projects
            </Link>
            .
          </div>
        )}
        <ProjectForm onSubmit={handleCreate} onSaveDraft={handleSaveDraft} />
      </div>
    </Layout>
  );
}

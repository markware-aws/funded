import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { CreateProjectInput, Project } from "@/types";

export default function SubmitPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/signin?returnUrl=/submit");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <Layout><div className="py-24 text-center text-gray-400">Loading…</div></Layout>;
  }

  const handleSaveDraft = async (input: CreateProjectInput) => {
    await api.post<Project>("/projects", input);
    router.push("/profile");
  };

  const handleCreate = async (input: CreateProjectInput) => {
    const project = await api.post<Project>("/projects", input);
    await api.post(`/projects/${(project as any).projectId}/submit`, {});
    router.push(`/projects/${(project as any).slug}`);
  };

  return (
    <Layout>
      <Head><title>Submit Project — funded.gr</title></Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Project</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your project will be reviewed before appearing publicly. Once approved you can request an AI evaluation.
        </p>
        <ProjectForm onSubmit={handleCreate} onSaveDraft={handleSaveDraft} />
      </div>
    </Layout>
  );
}

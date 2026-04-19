import useSWR from "swr";
import { fetcher, api } from "@/lib/api";
import { Project } from "@/types";

export function useAdminQueue() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    "/admin/projects",
    fetcher
  );

  const approve = async (projectId: string) => {
    await api.put(`/admin/projects/${projectId}/approve`, {});
    mutate();
  };

  const reject = async (projectId: string, reason?: string) => {
    await api.put(`/admin/projects/${projectId}/reject`, { reason });
    mutate();
  };

  return { projects: data ?? [], error, isLoading, approve, reject };
}

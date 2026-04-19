import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Project, ProjectsListResponse } from "@/types";

export function useProjects(
  sort: "likes" | "score" | "recent" = "likes",
  category?: string
) {
  const params = new URLSearchParams({ sort });
  if (category) params.set("category", category);
  return useSWR<ProjectsListResponse>(`/projects?${params}`, fetcher);
}

export function useUserProjects(userId?: string) {
  return useSWR<Project[]>(userId ? `/users/${userId}/projects` : null, fetcher);
}

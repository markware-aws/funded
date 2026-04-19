import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Project } from "@/types";

export function useProject(projectId?: string) {
  return useSWR<Project>(projectId ? `/projects/${projectId}` : null, fetcher);
}

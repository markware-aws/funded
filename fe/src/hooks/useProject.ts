import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Project } from "@/types";

export function useProject(slug?: string) {
  return useSWR<Project>(slug ? `/projects/${slug}` : null, fetcher);
}

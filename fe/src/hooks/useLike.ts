import { useRef } from "react";
import { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import { Project, ProjectsListResponse } from "@/types";

export function useLike(slug: string, projectId: string) {
  const { mutate } = useSWRConfig();
  const inFlight = useRef(false);

  const isProjectKey = (key: unknown) =>
    typeof key === "string" && key.startsWith("/projects");

  const applyOptimistic = (likedByMe: boolean, likeCount: number) =>
    mutate(
      isProjectKey,
      (data: Project | ProjectsListResponse | undefined) => {
        if (!data) return data;
        if ("projects" in data) {
          return {
            ...data,
            projects: (data as ProjectsListResponse).projects.map((p) =>
              p.projectId === projectId ? { ...p, likedByMe, likeCount } : p
            ),
          };
        }
        if ((data as Project).projectId === projectId) {
          return { ...(data as Project), likedByMe, likeCount };
        }
        return data;
      },
      { revalidate: false }
    );

  const toggle = async (currentlyLiked: boolean, currentCount: number) => {
    if (inFlight.current) return;
    inFlight.current = true;

    const newLiked = !currentlyLiked;
    const newCount = currentlyLiked ? currentCount - 1 : currentCount + 1;
    applyOptimistic(newLiked, newCount);

    try {
      if (currentlyLiked) {
        await api.delete(`/projects/${projectId}/like`);
      } else {
        await api.post(`/projects/${projectId}/like`, {});
      }
    } catch {
      applyOptimistic(currentlyLiked, currentCount);
    } finally {
      inFlight.current = false;
    }
  };

  return { toggle };
}

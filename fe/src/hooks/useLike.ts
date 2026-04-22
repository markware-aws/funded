import { useSWRConfig } from "swr";
import { api, ApiClientError } from "@/lib/api";
import { Project } from "@/types";

export function useLike(slug: string, projectId: string) {
  const { mutate } = useSWRConfig();
  const cacheKey = `/projects/${slug}`;

  const toggle = async (currentlyLiked: boolean, currentCount: number) => {
    mutate(
      cacheKey,
      (prev: Project | undefined) =>
        prev
          ? {
              ...prev,
              likedByMe: !currentlyLiked,
              likeCount: currentlyLiked ? currentCount - 1 : currentCount + 1,
            }
          : prev,
      false
    );

    try {
      if (currentlyLiked) {
        await api.delete(`/projects/${projectId}/like`);
      } else {
        await api.post(`/projects/${projectId}/like`, {});
      }
      mutate(cacheKey);
    } catch {
      mutate(cacheKey); // rollback
    }
  };

  return { toggle };
}

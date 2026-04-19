import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { User } from "@/types";

export function useMe(isAuthenticated: boolean) {
  return useSWR<User>(isAuthenticated ? "/users/me" : null, fetcher);
}

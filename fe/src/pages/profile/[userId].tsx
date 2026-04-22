import Head from "next/head";
import { useRouter } from "next/router";
import { Layout } from "@/components/layout/Layout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { PublicUser, Project } from "@/types";

export default function PublicProfilePage() {
  const router = useRouter();
  const userId = router.query.userId as string;

  const { data: user, isLoading } = useSWR<PublicUser>(userId ? `/users/${userId}` : null, fetcher);
  const { data: projects } = useSWR<Project[]>(userId ? `/users/${userId}/projects` : null, fetcher);

  if (isLoading) return <Layout><div className="py-24 text-center text-gray-400">Loading…</div></Layout>;
  if (!user) return <Layout><div className="py-24 text-center text-gray-400">User not found.</div></Layout>;

  return (
    <Layout>
      <Head><title>{user.name} — funded.gr</title></Head>
      <div>
        <div className="flex items-center gap-4 mb-8">
          {user.avatarUrl && <img src={user.avatarUrl} className="w-16 h-16 rounded-full" alt={user.name} />}
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <div className="flex gap-3 mt-1 text-sm text-brand-600">
              {user.githubUrl && <a href={user.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
              {user.twitterUrl && <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer">Twitter</a>}
            </div>
          </div>
        </div>

        {projects?.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((p) => <ProjectCard key={p.projectId} project={p} />)}
          </div>
        ) : (
          <p className="text-gray-400">No published projects yet.</p>
        )}
      </div>
    </Layout>
  );
}

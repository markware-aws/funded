import Head from "next/head";
import { useRouter } from "next/router";
import { Layout } from "@/components/layout/Layout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { PublicUser, Project } from "@/types";
import { ExternalLink, Github, Linkedin, Twitter } from "lucide-react";

export default function PublicProfilePage() {
  const router = useRouter();
  const userId = router.query.userId as string;

  const { data: user, isLoading } = useSWR<PublicUser>(
    userId ? `/users/${userId}` : null,
    fetcher,
  );
  const { data: projects } = useSWR<Project[]>(
    userId ? `/users/${userId}/projects` : null,
    fetcher,
  );

  if (isLoading)
    return (
      <Layout>
        <div className="py-24 text-center text-gray-400">Loading…</div>
      </Layout>
    );
  if (!user)
    return (
      <Layout>
        <div className="py-24 text-center text-gray-400">User not found.</div>
      </Layout>
    );

  return (
    <Layout>
      <Head>
        <title>{user.name} — funded.gr</title>
      </Head>
      <div>
        <div className="flex items-start gap-4 mb-8">
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              className="w-16 h-16 rounded-full"
              alt={user.name}
            />
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.bio && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-brand-600">
              {user.websiteUrl && (
                <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-4 w-4" /> Website
                </a>
              )}
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
              )}
              {user.twitterUrl && (
                <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                  <Twitter className="h-4 w-4" /> X/Twitter
                </a>
              )}
              {user.linkedinUrl && (
                <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {projects?.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.projectId} project={p} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No published projects yet.</p>
        )}
      </div>
    </Layout>
  );
}

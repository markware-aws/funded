import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { User, Project } from "@/types";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, reload } = useAuth();
  const tab = (router.query.tab as string) ?? "projects";

  const { data: myProjects } = useSWR<Project[]>(
    isAuthenticated && !!user?.userId && tab === "projects" ? `/users/${user.userId}/projects` : null,
    fetcher
  );

  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/signin?returnUrl=/profile");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) setEditForm({ name: user.name, githubUrl: user.githubUrl, twitterUrl: user.twitterUrl });
  }, [user]);

  if (isLoading || !isAuthenticated || !user) {
    return <Layout><div className="py-24 text-center text-gray-400">Loading…</div></Layout>;
  }

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/users/me", editForm);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const field = "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <Layout>
      <Head><title>Profile — funded.gr</title></Head>
      <div>
        <h1 className="text-2xl font-bold mb-6">{user.name}</h1>

        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {["projects", "settings"].map((t) => (
            <button key={t} onClick={() => router.push({ query: { tab: t } })}
              className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "projects" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Projects</h2>
              <Link href="/submit" className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700">
                + Submit Project
              </Link>
            </div>
            {!myProjects?.length ? (
              <p className="text-gray-400 text-sm">You haven't submitted any projects yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {myProjects.map((p) => (
                  <div key={p.projectId} className="relative">
                    <ProjectCard project={p} />
                    {p.reviewStatus !== "published" && (
                      <span className={`absolute top-3 right-3 text-xs rounded-full px-2 py-0.5 ${
                        p.reviewStatus === "draft"
                          ? "bg-gray-100 text-gray-600"
                          : p.reviewStatus === "pending_review"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {p.reviewStatus === "draft" ? "Draft" : p.reviewStatus === "pending_review" ? "Pending" : "Rejected"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input className={field} value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
              <input className={field} type="url" value={editForm.githubUrl ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, githubUrl: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
              <input className={field} type="url" value={editForm.twitterUrl ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, twitterUrl: e.target.value }))} />
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

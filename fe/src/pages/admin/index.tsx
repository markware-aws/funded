import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { projects, approve, reject, isLoading: queueLoading } = useAdminQueue();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return <Layout><div className="py-24 text-center text-gray-400">Loading…</div></Layout>;
  }

  return (
    <Layout>
      <Head><title>Admin — funded.gr</title></Head>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Review Queue</h1>

        {queueLoading ? (
          <div className="text-center text-gray-400 py-12">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Queue is empty.</div>
        ) : (
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.projectId} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/projects/${p.projectId}`} target="_blank"
                      className="font-semibold text-gray-900 hover:text-brand-600">
                      {p.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">{p.tagline}</p>
                    <div className="flex gap-2 mt-2 text-xs text-gray-400">
                      <span>{p.category}</span>
                      <span>·</span>
                      <span>{p.status}</span>
                      <span>·</span>
                      <span>Submitted {formatDate(p.createdAt)}</span>
                    </div>
                    {p.websiteUrl && (
                      <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:underline mt-1 inline-block">
                        {p.websiteUrl}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approve(p.projectId)}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">
                      Approve
                    </button>
                    <button onClick={() => reject(p.projectId)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

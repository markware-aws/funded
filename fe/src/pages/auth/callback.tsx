import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { exchangeCodeForTokens } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

export default function CallbackPage() {
  const router = useRouter();
  const { reload } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const { code, error: oauthError } = router.query;

    if (oauthError) {
      setError(typeof oauthError === "string" ? oauthError : "Authentication cancelled");
      return;
    }

    if (!code || typeof code !== "string") return;

    const redirectUri = window.location.origin + "/auth/callback";

    exchangeCodeForTokens(code, redirectUri)
      .then(() => reload())
      .then(() => router.replace("/profile"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Sign in failed");
      });
  }, [router.isReady, router.query]);

  return (
    <Layout>
      <Head><title>Signing in… — funded.gr</title></Head>
      <div className="py-24 text-center">
        {error ? (
          <div className="space-y-4">
            <p className="text-red-600 text-sm">{error}</p>
            <a href="/auth/signin" className="text-brand-600 text-sm hover:underline">
              Back to sign in
            </a>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Signing you in…</p>
        )}
      </div>
    </Layout>
  );
}

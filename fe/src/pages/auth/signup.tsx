import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { getGoogleSignInUrl } from "@/lib/auth";

type Step = "form" | "confirm";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, confirmSignUp, signIn, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/profile");
  }, [isLoading, isAuthenticated, router]);

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const field = "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, name);
      setStep("confirm");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmSignUp(email, code);
      await signIn(email, password);
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head><title>Sign Up — funded.gr</title></Head>
      <div className="mx-auto max-w-sm">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">🚧 Early Access — Not a 404</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            funded.gr is still baking. You can sign up and submit your project now,
            but listings won't go live until <strong>June 1, 2026</strong>.
            Think of yourself as a founding member — we're just bad at throwing launch parties on time.
          </p>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {step === "form" ? "Create account" : "Confirm your email"}
        </h1>

        {step === "form" && (
          <>
            <button
              type="button"
              onClick={() => { window.location.href = getGoogleSignInUrl(window.location.origin + "/auth/callback"); }}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition mb-6"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">or sign up with email</span>
              </div>
            </div>
          </>
        )}

        {step === "form" ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded border-gray-300 accent-brand-600" />
              <span className="text-xs text-gray-500 leading-relaxed">
                I have read and agree to the{" "}
                <Link href="/legal/terms" target="_blank" className="text-brand-600 hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/legal/privacy" target="_blank" className="text-brand-600 hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-gray-500">We sent a verification code to <strong>{email}</strong>.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input className={field} value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {loading ? "Confirming…" : "Confirm"}
            </button>
          </form>
        )}

        {step === "form" && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-brand-600 hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </Layout>
  );
}

import Head from "next/head";
import Script from "next/script";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { api, ApiClientError } from "@/lib/api";
import { Mail } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) =>
      setTurnstileToken(token);
    (window as any).onTurnstileExpire = () => setTurnstileToken("");
    return () => {
      delete (window as any).onTurnstileSuccess;
      delete (window as any).onTurnstileExpire;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the bot verification.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/contact", {
        name,
        email,
        subject,
        message,
        turnstile_token: turnstileToken,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const field =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <Layout>
      <Head>
        <title>Contact — funded.gr</title>
        <meta
          name="description"
          content="Get in touch with the funded.gr team."
        />
      </Head>

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />

      <div>
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Contact us
          </h1>
          <p className="text-gray-500 text-sm">
            Have a question or want to get in touch? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">
                    Email
                  </p>
                  <a
                    href="mailto:info@funded.gr"
                    className="text-sm text-blue-600 hover:underline font-mono"
                  >
                    info@funded.gr
                  </a>
                </div>
              </div>
            </div>
            <div
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              data-callback="onTurnstileSuccess"
              data-expired-callback="onTurnstileExpire"
              data-size="flexible"
            />
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <div className="bg-white border rounded-xl p-6">
              {success ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Message sent
                  </h2>
                  <p className="text-sm text-gray-500">
                    Thanks for reaching out. We'll get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        className={field}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        className={field}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      className={field}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's this about?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      className={`${field} resize-none`}
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Your message…"
                      required
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || !turnstileToken}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {loading ? "Sending…" : "Send message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

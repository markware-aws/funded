import Head from "next/head";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";

export default function NotFound() {
  return (
    <Layout>
      <Head><title>404 — funded.gr</title></Head>
      <div className="py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-200">404</h1>
        <p className="mt-4 text-gray-500">Page not found.</p>
        <Link href="/" className="mt-6 inline-block text-brand-600 hover:underline">Go home</Link>
      </div>
    </Layout>
  );
}

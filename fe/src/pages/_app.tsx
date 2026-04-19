import type { AppProps } from "next/app";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
        <Component {...pageProps} />
      </SWRConfig>
    </AuthProvider>
  );
}

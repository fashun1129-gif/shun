"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isAllowedEmail, DOMAIN_RESTRICTION_MESSAGE } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "domain") {
      setError(DOMAIN_RESTRICTION_MESSAGE);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      if (!isAllowedEmail(session.user.email)) {
        supabase.auth.signOut();
        return;
      }
      router.replace("/dashboard");
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setIsLoading(false);
      setError("ログインに失敗しました。時間をおいて再度お試しください。");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm mb-4 border border-white/20">
            <span className="text-4xl">🔬</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">PharmStudy</h1>
          <p className="text-indigo-200 text-lg">薬学大学院入試対策プラットフォーム</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2 text-center">ログイン</h2>
          <p className="text-indigo-200 text-sm text-center mb-8">
            Googleアカウントで1クリックでログイン
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isLoading ? "ログイン中..." : "Googleアカウントでログイン"}
          </button>

          {error && (
            <p className="text-red-300 text-xs text-center mt-4 bg-red-500/10 border border-red-400/30 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <p className="text-indigo-300 text-xs text-center mt-6">
            ログインすることで利用規約とプライバシーポリシーに同意したものとみなします
          </p>
        </div>

        {/* Features preview */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: "📝", label: "科目別クイズ" },
            { icon: "🤖", label: "AI弱点分析" },
            { icon: "📚", label: "知識まとめWiki" },
          ].map((f) => (
            <div key={f.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-indigo-200 text-xs">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, setSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);

  const handleLogin = async () => {
    if (!displayName.trim()) {
      setError("お名前を入力してください");
      return;
    }
    if (!passcode.trim()) {
      setError("合言葉を入力してください");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/check-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError("合言葉が違います");
        setIsLoading(false);
        return;
      }
      setSession({ displayName: displayName.trim() });
      router.replace("/dashboard");
    } catch {
      setError("ログインに失敗しました。時間をおいて再度お試しください。");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
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
            お名前と合言葉を入力してください
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="お名前"
              className="w-full bg-white/90 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="合言葉"
              className="w-full bg-white/90 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />}
            {isLoading ? "確認中..." : "ログイン"}
          </button>

          {error && (
            <p className="text-red-300 text-xs text-center mt-4 bg-red-500/10 border border-red-400/30 rounded-lg py-2 px-3">
              {error}
            </p>
          )}
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

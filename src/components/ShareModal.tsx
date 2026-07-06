"use client";

import { useEffect, useState } from "react";
import { Question } from "@/lib/mockData";
import { createSharedQuizSet } from "@/lib/shareApi";

type Props = {
  title: string;
  subjectId: string;
  subjectName: string;
  questions: Question[];
  createdBy: string;
  onClose: () => void;
};

export default function ShareModal({ title, subjectId, subjectName, questions, createdBy, onClose }: Props) {
  const [status, setStatus] = useState<"creating" | "ready" | "error">("creating");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createSharedQuizSet({ title, subjectId, createdBy, questions })
      .then((id) => {
        if (cancelled) return;
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        setShareUrl(`${origin}/share/${id}`);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [title, subjectId, createdBy, questions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">クイズセットを共有</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        <div className="bg-indigo-50 rounded-xl p-4 mb-5 border border-indigo-100">
          <p className="font-semibold text-gray-800">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{subjectName} · {questions.length}問</p>
        </div>

        <p className="text-sm text-gray-600 mb-3">共有リンク</p>

        {status === "creating" && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-5 px-1">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            リンクを発行しています...
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3 mb-5">
            リンクの発行に失敗しました。時間をおいて再度お試しください。
          </div>
        )}

        {status === "ready" && (
          <div className="flex gap-2 mb-5">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 truncate">
              {shareUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                copied
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {copied ? "✓ コピー済" : "コピー"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: "📱", label: "LINE", color: "bg-green-100 text-green-700 border-green-200" },
            { icon: "✉️", label: "メール", color: "bg-blue-100 text-blue-700 border-blue-200" },
            { icon: "🔗", label: "QRコード", color: "bg-purple-100 text-purple-700 border-purple-200" },
          ].map((item) => (
            <button key={item.label} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors hover:opacity-80 ${item.color}`}>
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-xs text-amber-700 flex gap-2">
          <span>ℹ️</span>
          <span>リンクを知っている人なら誰でもこのクイズセットにアクセスできます。</span>
        </div>
      </div>
    </div>
  );
}

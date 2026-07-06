"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SharedQuizSet } from "@/lib/shareApi";
import QuizComponent from "@/components/QuizComponent";

type Props = {
  sharedSet: SharedQuizSet;
};

export default function SharedQuizClient({ sharedSet }: Props) {
  const router = useRouter();
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [key, setKey] = useState(0);

  const handleResult = (results: { questionId: string; correct: boolean }[]) => {
    const correct = results.filter((r) => r.correct).length;
    setScore({ correct, total: results.length });
    setFinished(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors text-sm"
          >
            ← PharmStudyへ
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">共有クイズ</span>
              <span className="text-xs text-indigo-200">作成者: {sharedSet.createdBy}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{sharedSet.title}</h1>
            <p className="text-indigo-200 text-sm mt-0.5">{sharedSet.questions.length}問 · {sharedSet.createdAt}</p>
          </div>

          <div className="p-6">
            {!finished ? (
              <QuizComponent
                key={key}
                questions={sharedSet.questions}
                subjectName={sharedSet.title}
                onResult={handleResult}
              />
            ) : (
              <div className="text-center py-8 animate-fade-in">
                <div className="text-5xl mb-4">
                  {score && score.correct / score.total >= 0.8 ? "🎉" : "📚"}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">お疲れ様でした！</h2>
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-indigo-50 border-4 border-indigo-200 mb-6">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {score && Math.round((score.correct / score.total) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">{score?.correct}/{score?.total}</div>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setFinished(false); setScore(null); setKey((k) => k + 1); }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    もう一度
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    PharmStudyで学習
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

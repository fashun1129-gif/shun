"use client";

import { subjects } from "@/lib/mockData";

type QuizResult = {
  questionId: string;
  subject: string;
  correct: boolean;
  timestamp?: number;
};

type Props = {
  results: QuizResult[];
};

export default function WeaknessAnalysis({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">まだ学習データがありません</h3>
        <p className="text-gray-500 text-sm">クイズに挑戦すると、AIがあなたの弱点を分析します</p>
        <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-left max-w-md mx-auto">
          <p className="text-sm font-semibold text-indigo-700 mb-2">🤖 AI弱点分析の機能</p>
          <ul className="text-sm text-indigo-600 space-y-1 list-disc list-inside">
            <li>間違えた問題を自動分類</li>
            <li>弱点に合わせた類題を自動生成</li>
            <li>過去問との出題傾向を照合</li>
            <li>参考教科書のページを特定</li>
          </ul>
        </div>
      </div>
    );
  }

  const subjectStats = subjects.map((sub) => {
    const subResults = results.filter((r) => r.subject === sub.id);
    const total = subResults.length;
    const correct = subResults.filter((r) => r.correct).length;
    return {
      ...sub,
      total,
      correct,
      pct: total > 0 ? Math.round((correct / total) * 100) : null,
    };
  }).filter((s) => s.total > 0);

  const weak = subjectStats.filter((s) => s.pct !== null && s.pct < 70);
  const strong = subjectStats.filter((s) => s.pct !== null && s.pct >= 80);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="回答数" value={results.length} unit="問" color="blue" />
        <StatCard label="正解率" value={`${Math.round((results.filter(r => r.correct).length / results.length) * 100)}%`} color="green" />
        <StatCard label="弱点科目" value={weak.length} unit="科目" color="red" />
      </div>

      {/* Subject breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">科目別 正解率</h3>
        <div className="space-y-3">
          {subjectStats.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-lg w-8">{s.icon}</span>
              <span className="text-sm text-gray-600 w-24 flex-shrink-0">{s.name}</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    s.pct === null ? "w-0" :
                    s.pct >= 80 ? "bg-green-400" :
                    s.pct >= 60 ? "bg-yellow-400" : "bg-red-400"
                  }`}
                  style={{ width: s.pct !== null ? `${s.pct}%` : "0%" }}
                />
              </div>
              <span className={`text-sm font-semibold w-12 text-right ${
                s.pct === null ? "text-gray-400" :
                s.pct >= 80 ? "text-green-600" :
                s.pct >= 60 ? "text-yellow-600" : "text-red-600"
              }`}>
                {s.pct !== null ? `${s.pct}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weak areas */}
      {weak.length > 0 && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
          <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <span>⚠️</span> 強化が必要な科目
          </h3>
          <div className="space-y-3">
            {weak.map((s) => (
              <div key={s.id} className="bg-white rounded-xl p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="ml-auto text-red-600 font-bold text-lg">{s.pct}%</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">参照: {s.textbook}</p>
                <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700">
                  <p className="font-medium mb-1">🤖 AI推奨アクション</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>基礎概念を{s.textbook}で復習</li>
                    <li>AIチャットで弱点単元を質問</li>
                    <li>類題を自動生成して演習</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong areas */}
      {strong.length > 0 && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
          <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
            <span>✅</span> 得意科目
          </h3>
          <div className="flex flex-wrap gap-2">
            {strong.map((s) => (
              <span key={s.id} className="flex items-center gap-1 bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-sm">
                {s.icon} {s.name} {s.pct}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Generated Practice */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
        <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
          <span>✨</span> AI生成 類題（プレビュー）
        </h3>
        <p className="text-xs text-indigo-500 mb-4">弱点分野を基に自動生成された練習問題（Supabase連携後にフル機能が有効化されます）</p>
        <div className="bg-white rounded-xl p-4 border border-indigo-100">
          <p className="text-sm font-medium text-gray-700 mb-3">
            SN1とSN2反応の違いとして正しいものを選べ。
          </p>
          <div className="space-y-2">
            {["SN1は二次速度論に従う", "SN2ではワルデン反転が起こる", "SN1は一級ハロアルカンで起こりやすい", "SN2はカルボカチオン中間体を経る"].map((c, i) => (
              <div key={i} className={`px-3 py-2 rounded-lg text-sm border ${i === 1 ? "bg-green-50 border-green-300 text-green-700 font-medium" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                {String.fromCharCode(65 + i)}. {c}
                {i === 1 && " ✓"}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">参考: ボルハルト・ショアー現代有機化学(上)(下)</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    red: "text-red-600 bg-red-50 border-red-100",
  };
  return (
    <div className={`rounded-xl p-4 border text-center ${colorMap[color]}`}>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
      <div className="text-xs mt-1 opacity-70">{label}</div>
    </div>
  );
}

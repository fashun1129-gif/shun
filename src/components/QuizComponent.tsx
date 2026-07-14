"use client";

import { useState, useCallback } from "react";
import { Question } from "@/lib/mockData";

type Props = {
  questions: Question[];
  subjectName: string;
  onResult: (results: { questionId: string; correct: boolean }[]) => void;
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function QuizComponent({ questions, subjectName, onResult }: Props) {
  const [shuffled, setShuffled] = useState(() => shuffle(questions));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<{ questionId: string; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);

  const q = shuffled[current];

  const handleSelect = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    setResults((prev) => [...prev, { questionId: q.id, correct: idx === q.answer }]);
  }, [selected, q]);

  const handleNext = useCallback(() => {
    if (current + 1 >= shuffled.length) {
      setFinished(true);
      onResult([...results]);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  }, [current, shuffled.length, results, onResult]);

  const handleRestart = () => {
    setShuffled(shuffle(questions));
    setCurrent(0);
    setSelected(null);
    setShowExplanation(false);
    setResults([]);
    setFinished(false);
  };

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const pct = Math.round((correct / shuffled.length) * 100);
    return (
      <div className="animate-fade-in text-center py-8">
        <div className="text-6xl mb-4">{pct >= 80 ? "🎉" : pct >= 60 ? "📈" : "📚"}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">クイズ終了！</h2>
        <p className="text-gray-500 mb-6">{subjectName}</p>
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-indigo-50 border-4 border-indigo-200 mb-6">
          <div>
            <div className="text-3xl font-bold text-indigo-600">{pct}%</div>
            <div className="text-sm text-gray-500">{correct}/{shuffled.length} 正解</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={handleRestart} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            もう一度挑戦
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{current + 1} / {shuffled.length} 問</span>
        <div className="flex gap-1">
          {shuffled.map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${
              i < current ? "bg-indigo-400" : i === current ? "bg-indigo-600" : "bg-gray-200"
            }`} />
          ))}
        </div>
        <div className="flex gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            q.difficulty === "易" ? "bg-green-100 text-green-700" :
            q.difficulty === "普" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>{q.difficulty}</span>
          {q.year && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{q.year}年</span>}
        </div>
      </div>

      {/* Question */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-4 border border-indigo-100">
        <p className="text-gray-800 font-medium leading-relaxed text-lg">{q.question}</p>
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-4">
        {q.choices.map((choice, idx) => {
          let style = "bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
          if (selected !== null) {
            if (idx === q.answer) style = "bg-green-50 border-2 border-green-400";
            else if (idx === selected && selected !== q.answer) style = "bg-red-50 border-2 border-red-400";
            else style = "bg-white border-2 border-gray-200 opacity-60";
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-200 flex items-center gap-3 ${style}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                selected !== null && idx === q.answer ? "bg-green-500 text-white" :
                selected !== null && idx === selected && selected !== q.answer ? "bg-red-500 text-white" :
                "bg-gray-100 text-gray-600"
              }`}>
                {selected !== null && idx === q.answer ? "✓" :
                 selected !== null && idx === selected && selected !== q.answer ? "✗" :
                 String.fromCharCode(65 + idx)}
              </span>
              <span className="text-gray-700">{choice}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="animate-fade-in bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600">📖</span>
            <span className="font-semibold text-blue-800">解説</span>
            <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
              参考: {q.textbook}
            </span>
          </div>
          <p className="text-blue-900 text-sm leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {selected !== null && (
        <button onClick={handleNext} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
          {current + 1 >= shuffled.length ? "結果を確認" : "次の問題へ →"}
        </button>
      )}
    </div>
  );
}

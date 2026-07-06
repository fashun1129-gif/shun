"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

type Props = {
  subjectId?: string;
  subjectName?: string;
};

export default function AIChatComponent({ subjectId, subjectName }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `こんにちは！**PharmStudy AIアシスタント**です。${subjectName ? `\n\n現在は**${subjectName}**の学習中です。` : ""}\n\nアップロードされた過去問・レジュメ・教科書を優先して回答します。質問を入力してください。`,
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, subjectName, question: userMsg, history }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "AI応答の取得に失敗しました");
      setMessages((prev) => [...prev, { role: "assistant", content: body.answer, sources: body.sources ?? [] }]);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [...prev, { role: "assistant", content: `エラーが発生しました（${reason}）`, sources: [] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin" style={{ maxHeight: "calc(100vh - 340px)" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
              msg.role === "assistant" ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-600"
            }`}>
              {msg.role === "assistant" ? "🤖" : "👤"}
            </div>
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}>
                <MessageContent content={msg.content} isUser={msg.role === "user"} />
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1">
                  {msg.sources.map((s, j) => (
                    <span key={j} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>📚</span>{s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">🤖</div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-thin">
        {[
          subjectId === "chemistry" ? "SN2反応を説明して" : null,
          subjectId === "pharmaceutics" ? "BCS分類を教えて" : null,
          subjectId === "pharmaceutics" ? "定常状態について" : null,
          subjectId === "biology" ? "解糖系のATP収支" : null,
          "過去問頻出トピックは？",
          "この科目の弱点を分析して",
        ].filter(Boolean).map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInput(prompt!)}
            className="flex-shrink-0 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="質問を入力... (Enter で送信)"
          rows={2}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-12 h-12 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center self-end"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) return <span>{content}</span>;

  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
          return <p key={i} className="font-bold text-gray-900">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <p key={i} className="ml-3">• {line.slice(2)}</p>;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
              ) : part
            )}
          </p>
        );
      })}
    </div>
  );
}

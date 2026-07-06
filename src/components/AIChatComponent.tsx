"use client";

import { useState, useRef, useEffect } from "react";
import { textbooks } from "@/lib/mockData";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

const mockResponses: Record<string, { content: string; sources: string[] }> = {
  default: {
    content: "ご質問ありがとうございます。アップロードされた過去問・レジュメ・教科書を最優先で参照して回答します。\n\n実際のAI（Claude API）と接続すると、より詳細な回答が可能になります。",
    sources: ["スタンダード薬学シリーズII"],
  },
};

function getMockResponse(question: string, subjectId?: string): { content: string; sources: string[] } {
  const q = question.toLowerCase();

  if (q.includes("sn2") || q.includes("ワルデン") || q.includes("置換")) {
    return {
      content: `**SN2反応のまとめ**\n\nSN2（二分子求核置換）反応の主な特徴：\n\n1. **反応速度**: v = k[RX][Nu] （二次速度論）\n2. **立体化学**: ワルデン反転（背面攻撃による配置逆転）\n3. **基質の反応性**: CH₃X > 一級 > 二級 >> 三級\n4. **溶媒**: 極性非プロトン性溶媒（DMF, DMSO）が有利\n\n過去問（2022年）でも出題されており、SN1との比較（中間体の有無、立体化学、速度論）が重要です。`,
      sources: ["ボルハルト・ショアー現代有機化学(上)(下)", "（過去問2022年：有機化学）"],
    };
  }

  if (q.includes("バイオアベイラビリティ") || q.includes("bcs") || q.includes("吸収")) {
    return {
      content: `**バイオアベイラビリティ（F）の計算**\n\nF = fa × fg × fh\n\n- **fa**: 消化管吸収率（溶解性・透過性）\n- **fg**: 腸管代謝回避率（CYP3A4）\n- **fh**: 肝初回通過回避率\n\n**BCS分類との関係**\n| Class | 溶解性 | 透過性 | 製剤対策 |\n|-------|--------|--------|----------|\n| I | 高 | 高 | 不要 |\n| II | 低 | 高 | 微粉砕・固体分散体 |\n| III | 高 | 低 | 吸収促進剤 |\n| IV | 低 | 低 | 困難 |\n\n参照教科書と過去問を優先して回答しています。`,
      sources: ["薬剤学第5版 第3章", "コンパス生物薬剤学", "（過去問2023年：薬剤学）"],
    };
  }

  if (q.includes("解糖") || q.includes("グルコース") || q.includes("atp")) {
    return {
      content: `**解糖系の概要**\n\n解糖系（glycolysis）はグルコースをピルビン酸に分解する10段階の反応です。\n\n**エネルギー収支**\n- ATP消費: 2分子（ステップ1, 3）\n- ATP産生: 4分子（ステップ7, 10）\n- **正味: +2 ATP**\n- NADH産生: 2分子\n\n**律速酵素: ホスホフルクトキナーゼ-1（PFK-1）**\n- 活性化: AMP、ADP、フルクトース-2,6-ビスリン酸\n- 抑制: ATP（高エネルギー状態）、クエン酸\n\nこの内容はレーニンジャー第7版 第14章に詳述されています。`,
      sources: ["レーニンジャーの新生化学[上][下]第7版 第14章", "（過去問2021年：生化学）"],
    };
  }

  if (q.includes("半減期") || q.includes("定常状態") || q.includes("クリアランス")) {
    return {
      content: `**薬物動態学の基本パラメータ**\n\n**半減期 (t₁/₂)**\n$$t_{1/2} = \\frac{0.693 \\times Vd}{CL}$$\n\n**定常状態（Css）**\n- 半減期の約4〜5倍の時間で到達（理論値）\n- 臨床では「3〜5半減期」を目安\n\n**クリアランス (CL)**\n- 腎CL: CLr = (ろ過 + 分泌 - 再吸収) × fu\n- 肝CL: CLh = Qh × Eh\n\n📌 **TDM対象薬**: ジゴキシン、バンコマイシン、フェニトイン、テオフィリン\n\n過去問頻出トピックです。「半減期が長い薬物でも早く定常状態に達する方法」は負荷投与（Loading dose）で対応します。`,
      sources: ["コンパス薬物速度論演習", "個別化医療を目指した臨床薬物動態学1", "（過去問2022, 2023年：薬物動態学）"],
    };
  }

  if (q.includes("β遮断") || q.includes("受容体") || q.includes("アドレナリン")) {
    return {
      content: `**自律神経系受容体と薬物の分類**\n\n**β遮断薬の分類**\n| 薬物 | 選択性 | 特記事項 |\n|------|--------|----------|\n| プロプラノロール | 非選択性（β₁β₂） | 気管支攣縮リスク |\n| メトプロロール | β₁選択性 | 心臓選択性 |\n| カルベジロール | α₁β非選択性 | 心不全に使用 |\n| アテノロール | β₁選択性 | 腎排泄型 |\n\n**臨床的ポイント**\n- COPD/喘息患者: β₁選択的薬物を使用\n- 心不全: カルベジロール（α遮断による後負荷軽減）\n- 甲状腺クリーゼ: プロプラノロール（β₂遮断でT₄→T₃変換抑制）`,
      sources: ["NEW薬理学改訂第7版 第3章", "（過去問2022年：薬理学）"],
    };
  }

  return {
    content: `ご質問「**${question}**」について回答します。\n\n現在はモックデータで動作していますが、Claude API連携後は：\n\n1. **アップロードされた過去問**を最優先で参照\n2. **アップロードされたレジュメ**の内容を反映\n3. **指定教科書**（${textbooks.slice(0, 3).map((tb) => tb.title).join("、")} 等）を出典として明示\n\nして回答します。\n\n具体的な薬学トピック（SN2反応、バイオアベイラビリティ、解糖系、薬物動態パラメータ、β遮断薬など）をお試しください。`,
    sources: ["スタンダード薬学シリーズII"],
  };
}

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

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);
    setTimeout(() => {
      const resp = getMockResponse(userMsg, subjectId);
      setMessages((prev) => [...prev, { role: "assistant", content: resp.content, sources: resp.sources }]);
      setIsLoading(false);
    }, 1000 + Math.random() * 500);
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

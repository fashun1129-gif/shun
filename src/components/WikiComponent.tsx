"use client";

import { useEffect, useState } from "react";
import { wikiData } from "@/lib/mockData";
import { listWikiSections, WikiSection } from "@/lib/wikiApi";

type Props = {
  subjectId: string;
};

export default function WikiComponent({ subjectId }: Props) {
  const [aiSections, setAiSections] = useState<WikiSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    listWikiSections(subjectId).then((sections) => {
      if (!cancelled) {
        setAiSections(sections);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const staticData = wikiData[subjectId];
  const sections: WikiSection[] = [...(staticData?.sections ?? []), ...aiSections];

  if (isLoading) {
    return <div className="text-center py-16 text-sm text-gray-400">読み込み中...</div>;
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-4">📝</div>
        <p className="text-lg font-medium">この科目のWikiはまだ作成中です</p>
        <p className="text-sm mt-2">レジュメをアップロードしてAIに生成させることができます</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Section nav */}
      <div className="w-48 flex-shrink-0">
        <div className="bg-gray-50 rounded-xl p-3 sticky top-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">目次</p>
          <nav className="space-y-1">
            {sections.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === i
                    ? "bg-indigo-100 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {s.heading}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="animate-fade-in">
          {sections.map((section, i) => (
            <div
              key={i}
              className={`mb-6 ${i !== activeSection ? "hidden" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">{section.heading}</h2>
                {section.textbook && (
                  <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                    <span>📚</span>
                    <span>{section.textbook}</span>
                  </span>
                )}
              </div>
              <div className="prose prose-slate max-w-none">
                <WikiContent content={section.content} />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
            disabled={activeSection === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← 前のセクション
          </button>
          <button
            onClick={() => setActiveSection((s) => Math.min(sections.length - 1, s + 1))}
            disabled={activeSection === sections.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
          >
            次のセクション →
          </button>
        </div>
      </div>
    </div>
  );
}

function WikiContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const rendered: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("**") && line.endsWith("**") && !line.slice(2, -2).includes("**")) {
      rendered.push(
        <h3 key={i} className="font-bold text-gray-700 mt-4 mb-2 text-base">
          {line.slice(2, -2)}
        </h3>
      );
    } else if (line.startsWith("| ")) {
      // Table
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      rendered.push(<WikiTable key={`table-${i}`} lines={tableLines} />);
      continue;
    } else if (line.startsWith("- ")) {
      rendered.push(
        <li key={i} className="ml-4 text-gray-700 text-sm leading-relaxed list-disc">
          {formatInline(line.slice(2))}
        </li>
      );
    } else if (line.trim() === "") {
      rendered.push(<div key={i} className="h-2" />);
    } else {
      rendered.push(
        <p key={i} className="text-gray-700 text-sm leading-relaxed">
          {formatInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-1">{rendered}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function WikiTable({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((l) => !l.match(/^\|[-| ]+\|$/))
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
    );

  const [header, ...body] = rows;

  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-indigo-50">
            {header?.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-indigo-700 border border-indigo-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-700 border border-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

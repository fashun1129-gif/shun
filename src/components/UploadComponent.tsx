"use client";

import { useEffect, useRef, useState } from "react";
import { subjects, textbooks } from "@/lib/mockData";
import {
  DocType,
  DocumentRecord,
  deleteDocument,
  listDocuments,
  updateDocument,
  uploadDocument,
} from "@/lib/documentsApi";

const DOC_TYPE_LABEL: Record<DocType, string> = {
  past_exam: "過去問",
  resume: "レジュメ",
  textbook: "教科書",
};

const DOC_TYPE_ICON: Record<DocType, string> = {
  past_exam: "📋",
  resume: "📝",
  textbook: "📚",
};

const DOC_TYPE_STYLE: Record<DocType, string> = {
  past_exam: "bg-amber-100 text-amber-700 border-amber-200",
  resume: "bg-blue-100 text-blue-700 border-blue-200",
  textbook: "bg-purple-100 text-purple-700 border-purple-200",
};

function subjectName(subjectId: string) {
  return subjects.find((s) => s.id === subjectId)?.name ?? subjectId;
}

export default function UploadComponent() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0].id);
  const [selectedType, setSelectedType] = useState<DocType>("past_exam");
  const [textbookName, setTextbookName] = useState("");
  const [year, setYear] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDocuments = async () => {
    setIsLoadingList(true);
    const docs = await listDocuments();
    setDocuments(docs);
    setIsLoadingList(false);
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    if (selectedType === "textbook" && !textbookName.trim()) {
      setFormError("教科書名を入力してください");
      return;
    }
    setFormError("");
    setUploadingCount((c) => c + files.length);

    for (const file of files) {
      try {
        await uploadDocument({
          file,
          subjectId: selectedSubject,
          docType: selectedType,
          textbookName: selectedType === "textbook" ? textbookName.trim() : undefined,
          year: selectedType === "past_exam" && year ? Number(year) : undefined,
        });
      } catch {
        setFormError(`「${file.name}」のアップロードに失敗しました`);
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
    await refreshDocuments();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleDelete = async (doc: DocumentRecord) => {
    if (!confirm(`「${doc.title}」を削除しますか？この操作は取り消せません。`)) return;
    await deleteDocument(doc);
    await refreshDocuments();
  };

  const countByType = (type: DocType) => documents.filter((d) => d.docType === type).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
        <h3 className="font-semibold text-indigo-800 mb-1 flex items-center gap-2">
          <span>🔍</span> RAG（知識拡張）について
        </h3>
        <p className="text-xs text-indigo-600 leading-relaxed">
          過去問・レジュメ・教科書（PDF/画像）をアップロードすることで、AIがその内容を学習し、
          クイズ生成・AIチャットの回答に反映します。
        </p>
      </div>

      {/* Registered document summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4">
        {(["past_exam", "resume", "textbook"] as DocType[]).map((type) => (
          <div key={type} className="flex items-center gap-1.5 text-sm text-amber-800">
            <span>{DOC_TYPE_ICON[type]}</span>
            <span className="font-semibold">{countByType(type)}</span>
            <span className="text-xs text-amber-600">{DOC_TYPE_LABEL[type]}</span>
          </div>
        ))}
      </div>

      {/* Upload form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">書類の種類</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocType)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="past_exam">📋 過去問</option>
            <option value="resume">📝 レジュメ</option>
            <option value="textbook">📚 教科書</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">科目</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
        </div>

        {selectedType === "textbook" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">教科書名</label>
            <input
              list="textbook-options"
              value={textbookName}
              onChange={(e) => setTextbookName(e.target.value)}
              placeholder="例: 薬剤学第5版"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
            <datalist id="textbook-options">
              {textbooks.map((tb) => (
                <option key={tb} value={tb} />
              ))}
            </datalist>
          </div>
        )}

        {selectedType === "past_exam" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">年度（任意）</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="例: 2024"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>
        )}
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">
          {formError}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
        }`}
      >
        <div className="text-4xl mb-3">{isDragging ? "📂" : "📤"}</div>
        <p className="text-gray-700 font-medium mb-1">
          ファイルをドロップ、またはクリックして選択
        </p>
        <p className="text-xs text-gray-400">PDF・PNG・JPEG に対応 | 最大50MB</p>
        {uploadingCount > 0 && (
          <div className="text-xs text-indigo-500 mt-2 flex items-center justify-center gap-1.5">
            <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
            {uploadingCount}件アップロード中...
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            handleFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {/* Uploaded files list */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">登録済みファイル（{documents.length}件）</h3>
        {isLoadingList ? (
          <div className="text-center py-8 text-sm text-gray-400">読み込み中...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">まだファイルが登録されていません</div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) =>
              editingId === doc.id ? (
                <DocumentEditRow
                  key={doc.id}
                  doc={doc}
                  onCancel={() => setEditingId(null)}
                  onSave={async (updates) => {
                    await updateDocument(doc.id, updates);
                    setEditingId(null);
                    await refreshDocuments();
                  }}
                />
              ) : (
                <div key={doc.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors">
                  <span className="text-2xl flex-shrink-0">{DOC_TYPE_ICON[doc.docType]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{doc.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${DOC_TYPE_STYLE[doc.docType]}`}>
                        {DOC_TYPE_LABEL[doc.docType]}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {subjectName(doc.subjectId)}
                      </span>
                      {doc.textbookName && (
                        <span className="text-xs text-gray-400">{doc.textbookName}</span>
                      )}
                      {doc.year && (
                        <span className="text-xs text-gray-400">{doc.year}年</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {(doc.fileSize / 1024 / 1024).toFixed(1)}MB · {new Date(doc.uploadedAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingId(doc.id)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                      title="編集"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      title="削除"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Textbook list */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>📚</span> 参照教科書一覧
        </h3>
        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 gap-1.5">
          {textbooks.map((tb, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-indigo-400 text-xs font-mono w-5 text-right">{i + 1}.</span>
              {tb}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentEditRow({
  doc,
  onSave,
  onCancel,
}: {
  doc: DocumentRecord;
  onSave: (updates: { subjectId: string; docType: DocType; textbookName: string | null; year: number | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [subjectId, setSubjectId] = useState(doc.subjectId);
  const [docType, setDocType] = useState<DocType>(doc.docType);
  const [textbookName, setTextbookName] = useState(doc.textbookName ?? "");
  const [year, setYear] = useState(doc.year ? String(doc.year) : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      subjectId,
      docType,
      textbookName: docType === "textbook" ? textbookName.trim() || null : null,
      year: docType === "past_exam" && year ? Number(year) : null,
    });
    setSaving(false);
  };

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2">
      <p className="text-sm font-medium text-gray-700 truncate">{doc.title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select value={docType} onChange={(e) => setDocType(e.target.value as DocType)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
          <option value="past_exam">📋 過去問</option>
          <option value="resume">📝 レジュメ</option>
          <option value="textbook">📚 教科書</option>
        </select>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {docType === "textbook" && (
          <input
            list="textbook-options"
            value={textbookName}
            onChange={(e) => setTextbookName(e.target.value)}
            placeholder="教科書名"
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white col-span-2"
          />
        )}
        {docType === "past_exam" && (
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="年度"
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"
          />
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">キャンセル</button>
        <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}

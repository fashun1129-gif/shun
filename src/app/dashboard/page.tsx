"use client";

import { useState, useCallback, useEffect } from "react";
import { subjects, Question } from "@/lib/mockData";
import { listQuestionsBySubject } from "@/lib/questionsApi";
import QuizComponent from "@/components/QuizComponent";
import WikiComponent from "@/components/WikiComponent";
import AIChatComponent from "@/components/AIChatComponent";
import WeaknessAnalysis from "@/components/WeaknessAnalysis";
import UploadComponent from "@/components/UploadComponent";
import ShareModal from "@/components/ShareModal";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isAllowedEmail } from "@/lib/auth";

type Tab = "quiz" | "wiki" | "ai-chat" | "weakness" | "upload";

type QuizResult = {
  questionId: string;
  subject: string;
  correct: boolean;
  timestamp: number;
};

type CurrentUser = {
  name: string;
  email: string;
  avatar: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0].id);
  const [activeTab, setActiveTab] = useState<Tab>("quiz");
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, Question[]>>({});
  const [questionsLoading, setQuestionsLoading] = useState(true);

  const refreshQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    const grouped = await listQuestionsBySubject();
    setQuestionsBySubject(grouped);
    setQuestionsLoading(false);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    refreshQuestions();
  }, [authChecked, activeTab, refreshQuestions]);

  useEffect(() => {
    // Rely solely on onAuthStateChange (fires once immediately with the current
    // session, then again on future changes) instead of a separate getSession()
    // call — running both raced on production when landing here right after the
    // OAuth redirect, since the URL's #access_token hadn't been parsed into a
    // session yet when getSession() ran, incorrectly bouncing the user back out.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/");
        return;
      }
      if (!isAllowedEmail(session.user.email)) {
        supabase.auth.signOut().then(() => router.replace("/?error=domain"));
        return;
      }
      const name = session.user.user_metadata?.full_name ?? session.user.email ?? "ユーザー";
      setUser({
        name,
        email: session.user.email ?? "",
        avatar: name.charAt(0),
      });
      setAuthChecked(true);
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubject)!;
  const currentQuestions = questionsBySubject[selectedSubject] ?? [];

  const handleQuizResult = useCallback((results: { questionId: string; correct: boolean }[]) => {
    const newResults = results.map((r) => ({
      ...r,
      subject: selectedSubject,
      timestamp: Date.now(),
    }));
    setQuizResults((prev) => [...prev, ...newResults]);
  }, [selectedSubject]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "quiz", label: "クイズ", icon: "📝" },
    { id: "wiki", label: "Wiki", icon: "📖" },
    { id: "ai-chat", label: "AIチャット", icon: "🤖" },
    { id: "weakness", label: "弱点分析", icon: "📊" },
    { id: "upload", label: "アップロード", icon: "📤" },
  ];

  if (!authChecked || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            <span className="font-bold text-gray-800 text-lg">PharmStudy</span>
          </div>
          <span className="text-gray-300 hidden sm:block">|</span>
          <span className="text-sm text-gray-500 hidden sm:block">薬学大学院入試対策</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-full">
            <span>📋</span> 過去問・レジュメ・教科書をAIが学習
          </div>
          <button
            onClick={handleLogout}
            title="ログアウト"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              {user.avatar}
            </div>
            <span className="text-sm text-gray-700 hidden sm:block">{user.name}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} bg-indigo-950 flex-shrink-0 transition-all duration-300 flex flex-col`}>
          <div className="p-3 pt-4">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide px-3 mb-2">科目</p>
            <nav className="space-y-1">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left ${
                    selectedSubject === sub.id
                      ? "bg-indigo-600 text-white"
                      : "text-indigo-200 hover:bg-indigo-800"
                  }`}
                >
                  <span className="text-base">{sub.icon}</span>
                  <span className="truncate">{sub.name}</span>
                  {questionsBySubject[sub.id]?.length > 0 && (
                    <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      selectedSubject === sub.id ? "bg-indigo-500 text-white" : "bg-indigo-900 text-indigo-300"
                    }`}>
                      {questionsBySubject[sub.id].length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="mt-auto p-3">
            <div className="bg-indigo-900 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-xs text-indigo-300 font-medium">学習進捗</p>
              <p className="text-lg font-bold text-white mt-1">{quizResults.length}<span className="text-xs font-normal text-indigo-300">問 解答済</span></p>
              {quizResults.length > 0 && (
                <p className="text-xs text-green-400 mt-0.5">
                  正解率: {Math.round(quizResults.filter(r => r.correct).length / quizResults.length * 100)}%
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Subject header */}
          <div className={`${currentSubject.color} px-6 py-4 flex items-center justify-between flex-shrink-0`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentSubject.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-white">{currentSubject.name}</h1>
                <p className="text-white/70 text-xs">参照教科書: {currentSubject.textbook}</p>
              </div>
            </div>
            {activeTab === "quiz" && currentQuestions.length > 0 && (
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                🔗 共有
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 px-4 flex gap-1 flex-shrink-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "quiz" && (
              <div className="max-w-2xl mx-auto">
                {questionsLoading ? (
                  <div className="text-center py-16 text-sm text-gray-400">読み込み中...</div>
                ) : currentQuestions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">📝</div>
                    <p className="text-lg font-medium text-gray-600">この科目の問題は準備中です</p>
                    <p className="text-sm text-gray-400 mt-2">過去問PDFをアップロードするか、AIに問題を生成させることができます</p>
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                      ファイルをアップロード
                    </button>
                  </div>
                ) : (
                  <QuizComponent
                    key={selectedSubject}
                    questions={currentQuestions}
                    subjectName={currentSubject.name}
                    onResult={handleQuizResult}
                  />
                )}
              </div>
            )}

            {activeTab === "wiki" && (
              <div className="max-w-3xl mx-auto">
                <WikiComponent key={selectedSubject} subjectId={selectedSubject} />
              </div>
            )}

            {activeTab === "ai-chat" && (
              <div className="max-w-2xl mx-auto h-full">
                <AIChatComponent
                  key={selectedSubject}
                  subjectId={selectedSubject}
                  subjectName={currentSubject.name}
                />
              </div>
            )}

            {activeTab === "weakness" && (
              <div className="max-w-2xl mx-auto">
                <WeaknessAnalysis results={quizResults} />
              </div>
            )}

            {activeTab === "upload" && (
              <div className="max-w-2xl mx-auto">
                <UploadComponent />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Share modal */}
      {showShare && (
        <ShareModal
          title={`${currentSubject.name} 重要問題集`}
          subjectId={selectedSubject}
          subjectName={currentSubject.name}
          questions={currentQuestions}
          createdBy={user.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

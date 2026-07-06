import Link from "next/link";
import { getSharedQuizSet } from "@/lib/shareApi";
import SharedQuizClient from "@/components/SharedQuizClient";

export default async function SharedQuizPage(props: PageProps<"/share/[id]">) {
  const { id } = await props.params;
  const sharedSet = await getSharedQuizSet(id);

  if (!sharedSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">クイズセットが見つかりません</h1>
          <p className="text-sm text-gray-500 mb-6">
            リンクが間違っているか、共有セットが削除された可能性があります。
          </p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            PharmStudyへ
          </Link>
        </div>
      </div>
    );
  }

  return <SharedQuizClient sharedSet={sharedSet} />;
}

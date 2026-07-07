export const metadata = {
  title: "プライバシーポリシー - PharmStudy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">プライバシーポリシー</h1>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-800 mb-2">本アプリについて</h2>
            <p>
              PharmStudy（以下「本アプリ」）は、薬学系大学院入試対策のための個人・グループ利用を目的とした学習支援アプリです。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">取得する情報</h2>
            <p>
              Googleアカウントでログインする際、氏名・メールアドレス・プロフィール画像など、Googleアカウントの基本的なプロフィール情報を取得します。
              これらの情報はログイン状態の管理と、本アプリ内での利用者識別のためにのみ使用します。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">アップロードされたデータ</h2>
            <p>
              利用者がアップロードした過去問・レジュメ・教科書等のファイルは、学習支援機能（クイズ生成・Wiki作成・AIチャット）のためにAI（Anthropic Claude API）による解析に利用されます。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">第三者提供</h2>
            <p>
              取得した情報を本アプリの提供目的以外で第三者に販売・提供することはありません。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-800 mb-2">お問い合わせ</h2>
            <p>
              本アプリの利用・データの取り扱いに関するお問い合わせは、本アプリの管理者までご連絡ください。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

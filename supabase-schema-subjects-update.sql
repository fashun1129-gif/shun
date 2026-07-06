-- pharma-exam-app: replace the 8-subject placeholder list with the real
-- 6-category curriculum (物理・化学・生物・薬理・薬剤・臨床).
-- Safe to run: documents / shared_quiz_sets have no rows yet.
-- Run this once in Supabase Dashboard > SQL Editor > New query > Run

delete from subjects;

insert into subjects (id, name, icon, color, textbook) values
  ('physics', '物理', '⚛️', 'bg-orange-500', 'アトキンス物理化学要論第7版 / パートナー分析化学Ⅰ・Ⅱ 改訂第4版増補'),
  ('chemistry', '化学', '⚗️', 'bg-purple-500', 'ボルハルト・ショアー現代有機化学（上）（下）'),
  ('biology', '生物', '🧬', 'bg-red-500', 'レーニンジャーの新生化学〔上〕〔下〕第7版 / Essential細胞生物学 原書第5版'),
  ('pharmacology', '薬理', '💉', 'bg-pink-500', 'NEW薬理学改訂第7版'),
  ('pharmaceutics', '薬剤', '💊', 'bg-blue-500', '薬剤学（第5版）/ コンパス薬物速度論演習 / コンパス生物薬剤学'),
  ('clinical', '臨床', '🏥', 'bg-teal-500', '新臨床腫瘍学 改訂第7版 / visual core pharma薬物治療学改訂14版 / 個別化医療を目指した臨床薬物動態学1（基礎編）/ スタンダード薬学シリーズII 薬学総論 薬学と社会 第2版');

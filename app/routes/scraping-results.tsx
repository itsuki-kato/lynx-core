import type { Route } from "./+types/home";
import { useLoaderData, useNavigate } from "react-router";
import { getSession } from "~/utils/session.server";
import { requireAuth } from "~/utils/auth.server";
import { Button } from "~/components/ui/button";
import { useAtom } from "jotai";
import { articlesAtom } from "~/atoms/article";
import type { ArticleItem } from "~/types/article";
import { useState } from "react";
import { ScrapingResultModal } from "~/components/scraping/ScrapingResultModal";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "スクレイピング結果" },
    { name: "description", content: "スクレイピング結果の表示" },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  // ログインチェック
  await requireAuth(request);

  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  return { user };
};

export default function ScrapingResults() {
  const { user } = useLoaderData();
  const [results] = useAtom(articlesAtom);
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<ArticleItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-blue-500">
                スクレイピング結果
              </span>
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              取得した{results.length}件のデータを表示します
            </p>
          </div>

          <Button
            onClick={() => navigate("/scraping")}
            className="mt-4 md:mt-0 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border border-emerald-500 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            スクレイピング画面に戻る
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(item => (
            <div
              key={item.id}
              className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
              onClick={() => {
                setSelectedItem(item);
                setIsDialogOpen(true);
              }}
            >
              {/* コンテンツ部分 */}
              <div className="flex-grow p-6 dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {item.metaTitle || "タイトルなし"}
                </h2>

                <a
                  href={item.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 block truncate"
                >
                  {item.articleUrl}
                </a>

                <div className="mt-3 text-gray-600 dark:text-gray-300 text-sm line-clamp-4 h-20 overflow-hidden">
                  {item.metaDescription || "コンテンツなし"}
                </div>
              </div>

              {/* フッター部分（常に最下部） */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between mt-auto">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isIndexable
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                >
                  {item.isIndexable ? "インデックス" : "ノーインデックス"}
                </span>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.internalLinks?.length || 0} リンク
                </span>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">データがありません</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">スクレイピングを実行して結果を取得してください</p>
            <Button
              onClick={() => navigate("/scraping")}
              className="mt-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
            >
              スクレイピング画面へ
            </Button>
          </div>
        )}
      </div>

      {/* 詳細表示モーダル */}
      {selectedItem && (
        <ScrapingResultModal
          item={selectedItem}
          isOpen={isDialogOpen}
          setOpen={setIsDialogOpen}
        />
      )}
    </div>
  );
}

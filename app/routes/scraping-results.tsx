import type { Route } from "./+types/home";
import { useLoaderData, useNavigate, useActionData, Form } from "react-router";
import { getSession } from "~/utils/session.server";
import { requireAuth } from "~/utils/auth.server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { useAtom } from "jotai";
import { articlesAtom } from "~/atoms/article";
import type { ArticleItem } from "~/types/article";
import { useState, useEffect } from "react";
import { ScrapingResultModal } from "~/components/scraping/ScrapingResultModal";
import { useToast } from "~/hooks/use-toast";
import { useResetAtom } from "jotai/utils";

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

// ArticleItem から ArticleDto への変換関数
function convertToArticleDto(article: ArticleItem) {
  return {
    articleUrl: article.articleUrl,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    isIndexable: article.isIndexable || false,
    internalLinks: article.internalLinks?.map(link => ({
      linkUrl: link.linkUrl,
      anchorText: link.anchorText || undefined,
      isFollow: link.isFollow || false,
      status: {
        code: link.status?.code || 0,
        redirectUrl: link.status?.redirectUrl || ""
      }
    })) || [],
    outerLinks: article.outerLinks?.map(link => ({
      linkUrl: link.linkUrl,
      anchorText: link.anchorText || undefined,
      isFollow: link.isFollow || false,
      status: {
        code: link.status?.code || 0,
        redirectUrl: link.status?.redirectUrl || ""
      }
    })) || [],
    headings: convertHeadings(article.headings || []),
    jsonLd: article.jsonLd || []
  };
}

// 再帰的に見出しを変換する関数
function convertHeadings(headings: HeadingItem[]) {
  return headings.map(heading => ({
    tag: heading.tag,
    text: heading.text,
    children: heading.children ? convertHeadings(heading.children) : []
  }));
}

export const action = async ({ request }: Route.ActionArgs) => {
  // ログインチェック
  await requireAuth(request);
  
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");
  
  const formData = await request.formData();
  const _action = formData.get("_action");
  
  if (_action === "save") {
    try {
      // FormDataからarticlesDataを取得
      const articlesData = formData.get("articlesData");
      
      if (!articlesData) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: "記事データが見つかりません" 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // APIを呼び出し
      const response = await fetch("http://localhost:3000/scraping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: 1, // 固定値
          articles: JSON.parse(articlesData as string)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return new Response(JSON.stringify({ 
          ok: false, 
          error: errorData.message || `API error: ${response.status}` 
        }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Save error:", error);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : "保存中にエラーが発生しました" 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return null;
};

export default function ScrapingResults() {
  const { user } = useLoaderData();
  const [results] = useAtom(articlesAtom);
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<ArticleItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const actionData = useActionData();
  const { toast } = useToast();

  // 保存結果に応じてトースト通知を表示
  useEffect(() => {
    if (actionData) {
      if (actionData.ok) {
        toast({
          title: "保存完了",
          description: "スクレイピング結果をDBに保存しました",
          variant: "default",
        });
      } else {
        toast({
          title: "エラー",
          description: actionData.error || "保存に失敗しました",
          variant: "destructive",
        });
      }
    }
  }, [actionData, toast]);

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

          <div className="flex space-x-2">
            <Button
              onClick={() => navigate("/scraping")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              スクレイピング画面に戻る
            </Button>
            
            {results.length > 0 && (
              <Form method="post">
                <input type="hidden" name="_action" value="save" />
                <input 
                  type="hidden" 
                  name="articlesData" 
                  value={JSON.stringify(results.map(item => convertToArticleDto(item)))} 
                />
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h1v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  DBに保存する
                </Button>
              </Form>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(item => (
            <Card
              key={item.id}
              className="h-full flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 cursor-pointer"
              onClick={() => {
                setSelectedItem(item);
                setIsDialogOpen(true);
              }}
            >
              {/* コンテンツ部分 */}
              <CardHeader className="pb-2">
                <CardTitle className="text-xl line-clamp-2">
                  {item.metaTitle || "タイトルなし"}
                </CardTitle>
                <CardDescription>
                  <a
                    href={item.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.articleUrl}
                  </a>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="text-gray-600 dark:text-gray-300 text-sm line-clamp-4">
                  {item.metaDescription || "コンテンツなし"}
                </div>
              </CardContent>

              {/* フッター部分（常に最下部） */}
              <CardFooter className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 justify-between mt-auto">
                <Badge 
                  variant={item.isIndexable ? "default" : "destructive"}
                  className={item.isIndexable
                    ? "bg-green-100 hover:bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40"
                    : "bg-red-100 hover:bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40"
                  }
                >
                  {item.isIndexable ? "インデックス" : "ノーインデックス"}
                </Badge>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.internalLinks?.length || 0} リンク
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>

        {results.length === 0 && (
          <Card className="p-8 text-center animate-fade-in">
            <CardContent className="flex flex-col items-center pt-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">データがありません</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">スクレイピングを実行して結果を取得してください</p>
            </CardContent>
            <CardFooter className="justify-center pt-0">
              <Button
                onClick={() => navigate("/scraping")}
                className="mt-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
              >
                スクレイピング画面へ
              </Button>
            </CardFooter>
          </Card>
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

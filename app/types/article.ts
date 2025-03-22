// 見出しの階層構造の型定義
export interface HeadingItem {
  id?: number;
  articleId?: number;
  tag: string;
  text: string;
  level?: number;
  parentId?: number | null;
  order?: number;
  parent?: HeadingItem;
  children: HeadingItem[];
}

// 内部リンクの型定義
export interface InternalLinkItem {
  id?: number;
  type?: string;
  criteriaArticleId?: number;
  linkedArticleId?: number;
  anchorText?: string | null;
  linkUrl: string;  
  rel?: string | null;
  isActive?: boolean;
}

// キーワードの型定義
export interface KeywordItem {
  id?: number;
  projectId?: number;
  keywordName: string;
  parentId?: number | null;
  level?: number;
  searchVolume?: number;
  cpc?: number | null;
  parentKeyword?: KeywordItem;
  childKeywords?: KeywordItem[];
}

// キーワードと記事の中間テーブルの型定義
export interface KeywordArticleItem {
  keywordId: number;
  articleId: number;
  keyword?: KeywordItem;
}

// 記事の型定義
export interface ArticleItem {
  id?: string | number;
  projectId?: number;
  articleUrl: string;
  metaTitle: string;
  metaDescription: string;
  isIndexable?: boolean;
  internalLinks?: InternalLinkItem[];
  linkedFrom?: InternalLinkItem[];
  headings?: HeadingItem[];
  keywords?: KeywordArticleItem[];
}
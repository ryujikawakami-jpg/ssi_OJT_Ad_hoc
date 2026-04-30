# ShopDemo — CLAUDE.md

## プロジェクト概要
QAエンジニア研修（OJT）用アドホックテスト演習ECサイト。
意図的に19件のバグが埋め込まれた教材システム。

## 技術スタック
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (`@theme inline` 記法)
- Supabase (PostgreSQL + Auth) — 無料枠
- Vercel — 無料枠

## 重要な設計判断

### Next.js 16 の破壊的変更
- `params`, `searchParams` は **Promise** → `use()` で展開が必要
- ページコンポーネント: `{ params }: { params: Promise<{ id: string }> }`

### Supabase Auth のロック問題
Supabase JS v2 は `navigator.locks` でセッション管理するが、React の二重マウントでロック競合が発生する。
`src/lib/supabase.ts` でカスタム `lock` 関数を設定し回避済み:
```ts
lock: async <R,>(_name, _acquireTimeout, fn: () => Promise<R>) => await fn()
```

### ログインフロー
`/auth/v1/token` を直接fetchし、localStorageに手動でセッション保存。
Supabase JSクライアントの `signInWithPassword` はロック問題で使用していない。

### 商品一覧の取得
認証ロックを回避するため、anon keyでREST APIを直接fetchしている（Supabaseクライアント経由ではない）。

### RLS ポリシー
- `is_admin()` 関数 (security definer) でadmin判定 → profilesテーブルの無限再帰回避
- orders の select ポリシーは意図的に `user_id` チェックなし（BUG #12）

## ディレクトリ構成
```
src/
├── app/
│   ├── login/          # ログイン（REST API直呼び）
│   ├── products/       # 商品一覧・詳細
│   ├── cart/           # カート
│   ├── checkout/       # 注文確認・完了
│   ├── orders/         # 注文履歴・詳細
│   ├── mypage/         # マイページ
│   └── admin/          # 管理画面（商品・注文・レポート）
├── components/         # 共通UI（TopNav, Footer, AdminSidebar等）
├── contexts/           # AuthContext, CartContext
└── lib/                # supabase.ts, types.ts
supabase/
├── schema.sql          # テーブル・RLS・関数
└── seed.sql            # 商品35点・注文49件・クーポン2種
doc/
└── OJT_guide.md        # 研修運用ガイド＋正解バグ19件
```

## バグの管理
- ソースコード内: `// BUG: #N — <概要>` コメント
- 一覧表示: `grep -R "BUG:" src/`
- 正解リスト: `doc/OJT_guide.md` セクション7

## アカウント
| ロール | メール | パスワード |
|--------|--------|-----------|
| 管理者 | admin@shopdemo.com | shopdemo2026 |
| 一般 | user@shopdemo.com | shopdemo2026 |

## コマンド
```bash
npm run dev      # 開発サーバー
npm run build    # ビルド
npm run reset    # 研修データリセット（要 SUPABASE_SERVICE_KEY）
npx vercel --prod  # 本番デプロイ
```

## 未実装機能（グレーアウト済み）
- TopNav: 読みもの、わたしたちについて、店舗
- AdminSidebar: ダッシュボード、顧客管理、設定
- マイページ: お気に入り、配送先、ログアウト
- ログイン: パスワードリセット、新規会員登録
- 管理画面: CSV書き出し、商品追加
- フッター: 全リンク

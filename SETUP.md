# ShopDemo セットアップ手順

## 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) にログインし、新規プロジェクトを作成
2. **Project Settings > API** から以下を取得:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY`（リセットスクリプト用）

## 2. データベース初期化

Supabase Dashboard の **SQL Editor** で以下を順番に実行:

```
1. supabase/schema.sql  — テーブル・RLS・トリガー作成
2. supabase/seed.sql    — 商品・注文・クーポンのシードデータ
```

## 3. ユーザー作成

Supabase Dashboard の **Authentication > Users** から2名作成:

| メール | パスワード | メタデータ |
|--------|-----------|-----------|
| admin@shopdemo.com | shopdemo2026 | `{"role": "admin"}` |
| user@shopdemo.com | shopdemo2026 | `{"role": "user"}` |

作成後、`profiles` テーブルのUUIDを確認し、`seed.sql` のプレースホルダUUIDを置換して再実行:
- `11111111-1111-1111-1111-111111111111` → admin の UUID
- `22222222-2222-2222-2222-222222222222` → user の UUID

## 4. 環境変数設定

```bash
cp .env.local.example .env.local
# 取得した値を設定
```

## 5. ローカル開発

```bash
npm install
npm run dev
```

## 6. Vercel デプロイ

1. GitHub にリポジトリをpush
2. [Vercel](https://vercel.com) でインポート
3. Environment Variables に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## 7. 研修リセット

```bash
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npm run reset
```

## 研修用アカウント

| ロール | メール | パスワード |
|--------|--------|-----------|
| 管理者 | admin@shopdemo.com | shopdemo2026 |
| 一般 | user@shopdemo.com | shopdemo2026 |

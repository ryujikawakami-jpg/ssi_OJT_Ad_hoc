/**
 * ShopDemo — Database Reset Script
 *
 * Truncates the orders table, re-seeds orders from seed.sql,
 * and resets product stock to original values.
 *
 * Usage:
 *   npx tsx scripts/reset.ts
 *
 * Required env vars:
 *   SUPABASE_URL          — your Supabase project URL
 *   SUPABASE_SERVICE_KEY  — service_role key (NOT anon key)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Original stock values keyed by SKU — must match seed.sql
const ORIGINAL_STOCK: Record<string, number> = {
  "CER-001": 45,
  "CER-002": 12,
  "CER-003": 30,
  "CER-004": 20,
  "CER-005": 8,
  "CER-006": 0,
  "WOD-001": 15,
  "WOD-002": 10,
  "WOD-003": 25,
  "WOD-004": 18,
  "WOD-005": 40,
  "WOD-006": 0,
  "TXT-001": 35,
  "TXT-002": 50,
  "TXT-003": 22,
  "TXT-004": 14,
  "TXT-005": 8,
  "MET-001": 28,
  "MET-002": 16,
  "MET-003": 10,
  "MET-004": 6,
  "MET-005": 0,
  "GLS-001": 12,
  "GLS-002": 20,
  "GLS-003": 5,
  "GLS-004": 3,
  "GLS-005": 18,
  "FRN-001": 4,
  "FRN-002": 2,
  "FRN-003": 8,
  "FRN-004": 0,
  "FRN-005": 3,
  "FRN-006": 5,
};

async function main() {
  console.log("=== ShopDemo Database Reset ===\n");

  // 1. Truncate orders
  console.log("1. Truncating orders table...");
  const { error: truncErr } = await supabase.rpc("truncate_orders");
  if (truncErr) {
    // If the RPC doesn't exist, fall back to deleting all rows
    console.log(
      "   RPC not available, falling back to delete all orders..."
    );
    const { error: delErr } = await supabase
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // match all rows
    if (delErr) {
      console.error("   Failed to delete orders:", delErr.message);
      process.exit(1);
    }
  }
  console.log("   Done.\n");

  // 2. Re-seed orders via seed.sql
  console.log("2. Re-seeding orders...");

  const adminUid = "3cada532-8fdc-4009-af23-0c6213a37b5f";
  const userUid = "9a8c4b56-5348-4c71-9078-c7afbbe027fe";

  // Seed orders via individual inserts using the JS client
  console.log("   Seeding orders via individual inserts...");
  await seedOrdersViaClient(adminUid, userUid);

  // 3. Reset product stock
  console.log("3. Resetting product stock to original values...");
  for (const [sku, stock] of Object.entries(ORIGINAL_STOCK)) {
    const { error } = await supabase
      .from("products")
      .update({ stock })
      .eq("sku", sku);
    if (error) {
      console.error(`   Failed to reset stock for ${sku}:`, error.message);
    }
  }
  console.log("   Done.\n");

  console.log("=== Reset complete ===");
}

/**
 * Fallback: insert orders one by one via the Supabase JS client.
 */
async function seedOrdersViaClient(adminUid: string, userUid: string) {
  const orders = buildOrderRows(adminUid, userUid);
  let inserted = 0;

  for (const order of orders) {
    const { error } = await supabase.from("orders").upsert(order, {
      onConflict: "order_no",
    });
    if (error) {
      console.error(
        `   Failed to insert ${order.order_no}:`,
        error.message
      );
    } else {
      inserted++;
    }
  }
  console.log(`   Inserted ${inserted}/${orders.length} orders.\n`);
}

interface OrderRow {
  order_no: string;
  user_id: string;
  user_name: string;
  items: Array<{ sku: string; name: string; price: number; qty: number }>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  created_at: string;
}

function buildOrderRows(adminUid: string, userUid: string): OrderRow[] {
  const u = userUid;
  const a = adminUid;
  const uAddr = "〒321-4217 栃木県芳賀郡益子町益子4852";
  const aAddr = "〒100-0001 東京都千代田区千代田1-1";

  return [
    { order_no: "SD-2025-0912-00101", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-001", name: "益子焼 飯碗 しのぎ", price: 2200, qty: 2 }, { sku: "WOD-005", name: "黒檀 箸 八角", price: 2800, qty: 1 }], subtotal: 7200, shipping: 600, discount: 0, total: 7800, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-09-12T10:23:00+09:00" },
    { order_no: "SD-2025-0918-00102", user_id: u, user_name: "佐藤 里香", items: [{ sku: "TXT-002", name: "今治タオル バスタオル 白雲", price: 4400, qty: 2 }], subtotal: 8800, shipping: 600, discount: 0, total: 9400, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-09-18T14:05:00+09:00" },
    { order_no: "SD-2025-0925-00103", user_id: a, user_name: "管理者", items: [{ sku: "MET-003", name: "南部鉄器 急須 丸型 0.5L", price: 8800, qty: 1 }], subtotal: 8800, shipping: 0, discount: 0, total: 8800, status: "お届け済", shipping_address: aAddr, payment_method: "代金引換", created_at: "2025-09-25T09:45:00+09:00" },
    { order_no: "SD-2025-1003-00104", user_id: u, user_name: "佐藤 里香", items: [{ sku: "GLS-002", name: "琉球ガラス タルグラス 海", price: 2800, qty: 4 }], subtotal: 11200, shipping: 600, discount: 500, total: 11300, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-10-03T11:30:00+09:00" },
    { order_no: "SD-2025-1010-00105", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-003", name: "丹波焼 マグカップ 黒釉", price: 3300, qty: 2 }, { sku: "CER-004", name: "沖縄やちむん 7寸皿 点打ち", price: 4400, qty: 1 }], subtotal: 11000, shipping: 600, discount: 0, total: 11600, status: "お届け済", shipping_address: uAddr, payment_method: "コンビニ決済", created_at: "2025-10-10T16:12:00+09:00" },
    { order_no: "SD-2025-1015-00106", user_id: a, user_name: "管理者", items: [{ sku: "FRN-001", name: "飛騨の家具 スツール 丸", price: 28000, qty: 1 }], subtotal: 28000, shipping: 0, discount: 1000, total: 27000, status: "お届け済", shipping_address: aAddr, payment_method: "クレジットカード", created_at: "2025-10-15T13:40:00+09:00" },
    { order_no: "SD-2025-1022-00107", user_id: u, user_name: "佐藤 里香", items: [{ sku: "WOD-001", name: "秋田杉 曲げわっぱ 弁当箱 小判型", price: 9900, qty: 1 }], subtotal: 9900, shipping: 600, discount: 0, total: 10500, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-10-22T08:55:00+09:00" },
    { order_no: "SD-2025-1028-00108", user_id: u, user_name: "佐藤 里香", items: [{ sku: "TXT-001", name: "倉敷帆布 トートバッグ M 生成", price: 5500, qty: 1 }, { sku: "TXT-003", name: "久留米絣 コースター 5枚組", price: 2200, qty: 1 }], subtotal: 7700, shipping: 600, discount: 0, total: 8300, status: "お届け済", shipping_address: uAddr, payment_method: "コンビニ決済", created_at: "2025-10-28T17:20:00+09:00" },
    { order_no: "SD-2025-1105-00109", user_id: u, user_name: "佐藤 里香", items: [{ sku: "MET-001", name: "燕三条 ステンレスタンブラー 二重構造", price: 4200, qty: 2 }], subtotal: 8400, shipping: 600, discount: 0, total: 9000, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-11-05T12:10:00+09:00" },
    { order_no: "SD-2025-1112-00110", user_id: u, user_name: "佐藤 里香", items: [{ sku: "GLS-003", name: "江戸切子 ロックグラス 矢来", price: 16500, qty: 1 }], subtotal: 16500, shipping: 0, discount: 0, total: 16500, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-11-12T15:33:00+09:00" },
    { order_no: "SD-2025-1118-00111", user_id: a, user_name: "管理者", items: [{ sku: "CER-005", name: "備前焼 ぐい呑", price: 5500, qty: 2 }, { sku: "MET-004", name: "錫 ぐい呑 月", price: 6600, qty: 1 }], subtotal: 17600, shipping: 0, discount: 0, total: 17600, status: "お届け済", shipping_address: aAddr, payment_method: "クレジットカード", created_at: "2025-11-18T10:05:00+09:00" },
    { order_no: "SD-2025-1125-00112", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-002", name: "信楽焼 花入 自然釉", price: 8800, qty: 1 }], subtotal: 8800, shipping: 600, discount: 0, total: 9400, status: "お届け済", shipping_address: uAddr, payment_method: "コンビニ決済", created_at: "2025-11-25T14:48:00+09:00" },
    { order_no: "SD-2025-1201-00113", user_id: u, user_name: "佐藤 里香", items: [{ sku: "WOD-003", name: "欅 汁椀 拭漆", price: 4800, qty: 2 }, { sku: "WOD-004", name: "栗材 丸皿 21cm", price: 3800, qty: 2 }], subtotal: 17200, shipping: 600, discount: 0, total: 17800, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-12-01T09:15:00+09:00" },
    { order_no: "SD-2025-1208-00114", user_id: u, user_name: "佐藤 里香", items: [{ sku: "TXT-005", name: "遠州綿紬 ストール", price: 6800, qty: 1 }], subtotal: 6800, shipping: 600, discount: 0, total: 7400, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-12-08T11:22:00+09:00" },
    { order_no: "SD-2025-1215-00115", user_id: u, user_name: "佐藤 里香", items: [{ sku: "GLS-004", name: "薩摩切子 ぐい呑 紅", price: 38000, qty: 1 }], subtotal: 38000, shipping: 0, discount: 0, total: 38000, status: "キャンセル", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-12-15T16:50:00+09:00" },
    { order_no: "SD-2025-1220-00116", user_id: u, user_name: "佐藤 里香", items: [{ sku: "MET-002", name: "高岡銅器 風鈴 南部型", price: 3800, qty: 1 }, { sku: "GLS-005", name: "菅原工芸 一輪挿し 雫", price: 3300, qty: 1 }], subtotal: 7100, shipping: 600, discount: 0, total: 7700, status: "お届け済", shipping_address: uAddr, payment_method: "代金引換", created_at: "2025-12-20T13:40:00+09:00" },
    { order_no: "SD-2025-1225-00117", user_id: a, user_name: "管理者", items: [{ sku: "TXT-004", name: "南部裂織 ポーチ", price: 3600, qty: 2 }], subtotal: 7200, shipping: 0, discount: 0, total: 7200, status: "お届け済", shipping_address: aAddr, payment_method: "クレジットカード", created_at: "2025-12-25T10:00:00+09:00" },
    { order_no: "SD-2025-1228-00118", user_id: u, user_name: "佐藤 里香", items: [{ sku: "FRN-003", name: "旭川 ウォールシェルフ 60cm", price: 12000, qty: 1 }], subtotal: 12000, shipping: 600, discount: 0, total: 12600, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2025-12-28T15:10:00+09:00" },
    { order_no: "SD-2026-0105-00119", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-001", name: "益子焼 飯碗 しのぎ", price: 2200, qty: 1 }, { sku: "CER-003", name: "丹波焼 マグカップ 黒釉", price: 3300, qty: 1 }], subtotal: 5500, shipping: 600, discount: 500, total: 5600, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-01-05T10:30:00+09:00" },
    { order_no: "SD-2026-0112-00120", user_id: u, user_name: "佐藤 里香", items: [{ sku: "WOD-002", name: "桜材 カッティングボード", price: 6600, qty: 1 }], subtotal: 6600, shipping: 600, discount: 0, total: 7200, status: "お届け済", shipping_address: uAddr, payment_method: "コンビニ決済", created_at: "2026-01-12T14:20:00+09:00" },
    { order_no: "SD-2026-0120-00121", user_id: u, user_name: "佐藤 里香", items: [{ sku: "GLS-001", name: "津軽びいどろ 花瓶 彩", price: 5500, qty: 1 }], subtotal: 5500, shipping: 600, discount: 0, total: 6100, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-01-20T09:45:00+09:00" },
    { order_no: "SD-2026-0128-00122", user_id: a, user_name: "管理者", items: [{ sku: "FRN-005", name: "静岡 茶箪笥 小", price: 32000, qty: 1 }], subtotal: 32000, shipping: 0, discount: 0, total: 32000, status: "お届け済", shipping_address: aAddr, payment_method: "クレジットカード", created_at: "2026-01-28T11:55:00+09:00" },
    { order_no: "SD-2026-0203-00123", user_id: u, user_name: "佐藤 里香", items: [{ sku: "MET-001", name: "燕三条 ステンレスタンブラー 二重構造", price: 4200, qty: 1 }, { sku: "MET-003", name: "南部鉄器 急須 丸型 0.5L", price: 8800, qty: 1 }], subtotal: 13000, shipping: 600, discount: 0, total: 13600, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-02-03T13:15:00+09:00" },
    { order_no: "SD-2026-0210-00124", user_id: u, user_name: "佐藤 里香", items: [{ sku: "TXT-002", name: "今治タオル バスタオル 白雲", price: 4400, qty: 3 }], subtotal: 13200, shipping: 600, discount: 0, total: 13800, status: "お届け済", shipping_address: uAddr, payment_method: "コンビニ決済", created_at: "2026-02-10T16:30:00+09:00" },
    { order_no: "SD-2026-0218-00125", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-004", name: "沖縄やちむん 7寸皿 点打ち", price: 4400, qty: 2 }], subtotal: 8800, shipping: 600, discount: 0, total: 9400, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-02-18T10:00:00+09:00" },
    { order_no: "SD-2026-0225-00126", user_id: u, user_name: "佐藤 里香", items: [{ sku: "FRN-006", name: "飛騨 サイドテーブル ビーンズ", price: 22000, qty: 1 }], subtotal: 22000, shipping: 0, discount: 1000, total: 21000, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-02-25T14:45:00+09:00" },
    { order_no: "SD-2026-0303-00127", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-005", name: "備前焼 ぐい呑", price: 5500, qty: 1 }, { sku: "GLS-002", name: "琉球ガラス タルグラス 海", price: 2800, qty: 2 }], subtotal: 11100, shipping: 600, discount: 0, total: 11700, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-03-03T11:20:00+09:00" },
    { order_no: "SD-2026-0310-00128", user_id: u, user_name: "佐藤 里香", items: [{ sku: "WOD-005", name: "黒檀 箸 八角", price: 2800, qty: 2 }], subtotal: 5600, shipping: 600, discount: 0, total: 6200, status: "お届け済", shipping_address: uAddr, payment_method: "代金引換", created_at: "2026-03-10T09:10:00+09:00" },
    { order_no: "SD-2026-0315-00129", user_id: a, user_name: "管理者", items: [{ sku: "GLS-003", name: "江戸切子 ロックグラス 矢来", price: 16500, qty: 2 }], subtotal: 33000, shipping: 0, discount: 0, total: 33000, status: "お届け済", shipping_address: aAddr, payment_method: "クレジットカード", created_at: "2026-03-15T15:30:00+09:00" },
    { order_no: "SD-2026-0318-00130", user_id: u, user_name: "佐藤 里香", items: [{ sku: "TXT-001", name: "倉敷帆布 トートバッグ M 生成", price: 5500, qty: 2 }], subtotal: 11000, shipping: 600, discount: 500, total: 11100, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-03-18T12:40:00+09:00" },
    { order_no: "SD-2026-0322-00131", user_id: u, user_name: "佐藤 里香", items: [{ sku: "MET-004", name: "錫 ぐい呑 月", price: 6600, qty: 1 }], subtotal: 6600, shipping: 600, discount: 0, total: 7200, status: "お届け済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-03-22T17:00:00+09:00" },
    { order_no: "SD-2026-0325-00132", user_id: u, user_name: "佐藤 里香", items: [{ sku: "WOD-003", name: "欅 汁椀 拭漆", price: 4800, qty: 1 }], subtotal: 4800, shipping: 600, discount: 0, total: 5400, status: "発送済", shipping_address: uAddr, payment_method: "コンビニ決済", created_at: "2026-03-25T10:50:00+09:00" },
    { order_no: "SD-2026-0328-00133", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-002", name: "信楽焼 花入 自然釉", price: 8800, qty: 1 }, { sku: "CER-001", name: "益子焼 飯碗 しのぎ", price: 2200, qty: 2 }], subtotal: 13200, shipping: 600, discount: 0, total: 13800, status: "発送済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-03-28T14:15:00+09:00" },
    { order_no: "SD-2026-0401-00134", user_id: u, user_name: "佐藤 里香", items: [{ sku: "TXT-005", name: "遠州綿紬 ストール", price: 6800, qty: 1 }, { sku: "TXT-003", name: "久留米絣 コースター 5枚組", price: 2200, qty: 2 }], subtotal: 11200, shipping: 600, discount: 0, total: 11800, status: "配送中", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-01T09:30:00+09:00" },
    { order_no: "SD-2026-0403-00135", user_id: u, user_name: "佐藤 里香", items: [{ sku: "FRN-001", name: "飛騨の家具 スツール 丸", price: 28000, qty: 1 }], subtotal: 28000, shipping: 0, discount: 0, total: 28000, status: "配送中", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-03T11:45:00+09:00" },
    { order_no: "SD-2026-0405-00136", user_id: a, user_name: "管理者", items: [{ sku: "WOD-001", name: "秋田杉 曲げわっぱ 弁当箱 小判型", price: 9900, qty: 1 }], subtotal: 9900, shipping: 0, discount: 0, total: 9900, status: "配送中", shipping_address: aAddr, payment_method: "クレジットカード", created_at: "2026-04-05T13:20:00+09:00" },
    { order_no: "SD-2026-0408-00137", user_id: u, user_name: "佐藤 里香", items: [{ sku: "MET-002", name: "高岡銅器 風鈴 南部型", price: 3800, qty: 2 }], subtotal: 7600, shipping: 600, discount: 0, total: 8200, status: "発送済", shipping_address: uAddr, payment_method: "代金引換", created_at: "2026-04-08T10:10:00+09:00" },
    { order_no: "SD-2026-0410-00138", user_id: u, user_name: "佐藤 里香", items: [{ sku: "GLS-005", name: "菅原工芸 一輪挿し 雫", price: 3300, qty: 2 }], subtotal: 6600, shipping: 600, discount: 0, total: 7200, status: "発送済", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-10T15:55:00+09:00" },
    { order_no: "SD-2026-0412-00139", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-003", name: "丹波焼 マグカップ 黒釉", price: 3300, qty: 3 }], subtotal: 9900, shipping: 600, discount: 0, total: 10500, status: "処理中", shipping_address: uAddr, payment_method: "コンビニ決済", created_at: "2026-04-12T08:40:00+09:00" },
    { order_no: "SD-2026-0414-00140", user_id: u, user_name: "佐藤 里香", items: [{ sku: "WOD-004", name: "栗材 丸皿 21cm", price: 3800, qty: 1 }, { sku: "WOD-002", name: "桜材 カッティングボード", price: 6600, qty: 1 }], subtotal: 10400, shipping: 600, discount: 0, total: 11000, status: "処理中", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-14T12:30:00+09:00" },
    { order_no: "SD-2026-0415-00141", user_id: u, user_name: "佐藤 里香", items: [{ sku: "GLS-001", name: "津軽びいどろ 花瓶 彩", price: 5500, qty: 1 }], subtotal: 5500, shipping: 600, discount: 500, total: 5600, status: "処理中", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-15T14:10:00+09:00" },
    { order_no: "SD-2026-0416-00142", user_id: a, user_name: "管理者", items: [{ sku: "MET-001", name: "燕三条 ステンレスタンブラー 二重構造", price: 4200, qty: 3 }], subtotal: 12600, shipping: 0, discount: 0, total: 12600, status: "処理中", shipping_address: aAddr, payment_method: "クレジットカード", created_at: "2026-04-16T10:00:00+09:00" },
    { order_no: "SD-2026-0417-00143", user_id: u, user_name: "佐藤 里香", items: [{ sku: "TXT-004", name: "南部裂織 ポーチ", price: 3600, qty: 1 }, { sku: "TXT-002", name: "今治タオル バスタオル 白雲", price: 4400, qty: 1 }], subtotal: 8000, shipping: 600, discount: 0, total: 8600, status: "処理中", shipping_address: uAddr, payment_method: "代金引換", created_at: "2026-04-17T16:20:00+09:00" },
    { order_no: "SD-2026-0418-00144", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-004", name: "沖縄やちむん 7寸皿 点打ち", price: 4400, qty: 1 }], subtotal: 4400, shipping: 600, discount: 0, total: 5000, status: "処理中", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-18T09:00:00+09:00" },
    { order_no: "SD-2026-0419-00145", user_id: u, user_name: "佐藤 里香", items: [{ sku: "GLS-002", name: "琉球ガラス タルグラス 海", price: 2800, qty: 3 }], subtotal: 8400, shipping: 600, discount: 0, total: 9000, status: "キャンセル", shipping_address: uAddr, payment_method: "コンビニ決済", created_at: "2026-04-19T11:30:00+09:00" },
    { order_no: "SD-2026-0420-00146", user_id: u, user_name: "佐藤 里香", items: [{ sku: "FRN-006", name: "飛騨 サイドテーブル ビーンズ", price: 22000, qty: 1 }], subtotal: 22000, shipping: 0, discount: 0, total: 22000, status: "処理中", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-20T13:50:00+09:00" },
    { order_no: "SD-2026-0421-00147", user_id: u, user_name: "佐藤 里香", items: [{ sku: "CER-001", name: "益子焼 飯碗 しのぎ", price: 2200, qty: 3 }, { sku: "CER-005", name: "備前焼 ぐい呑", price: 5500, qty: 1 }], subtotal: 12100, shipping: 600, discount: 0, total: 12700, status: "処理中", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-21T10:15:00+09:00" },
    { order_no: "SD-2026-0422-00148", user_id: u, user_name: "佐藤 里香", items: [{ sku: "MET-003", name: "南部鉄器 急須 丸型 0.5L", price: 8800, qty: 1 }], subtotal: 8800, shipping: 600, discount: 0, total: 9400, status: "処理中", shipping_address: uAddr, payment_method: "代金引換", created_at: "2026-04-22T15:30:00+09:00" },
    { order_no: "SD-2026-0423-00149", user_id: u, user_name: "佐藤 里香", items: [{ sku: "WOD-001", name: "秋田杉 曲げわっぱ 弁当箱 小判型", price: 9900, qty: 1 }, { sku: "WOD-005", name: "黒檀 箸 八角", price: 2800, qty: 1 }], subtotal: 12700, shipping: 600, discount: 0, total: 13300, status: "処理中", shipping_address: uAddr, payment_method: "クレジットカード", created_at: "2026-04-23T08:00:00+09:00" },
  ];
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

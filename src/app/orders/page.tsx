"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoreLayout from "@/components/StoreLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Order } from "@/lib/types";

const STATUS_FILTERS = ["すべて", "処理中", "発送準備中", "発送済", "配送中", "お届け済", "キャンセル"];

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("すべて");
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setOrders(data as Order[]);
    };
    load();
  }, [user]);

  const filtered = filter === "すべて" ? orders : orders.filter((o) => o.status === filter);

  const statusColor = (s: string) => {
    if (s === "キャンセル") return "var(--sd-wine)";
    if (s === "処理中" || s === "発送準備中") return "var(--sd-ochre)";
    return "var(--sd-moss)";
  };

  return (
    <StoreLayout>
      <div style={{ padding: "44px 44px 20px", borderBottom: "var(--sd-line)" }}>
        <div className="en-caps">Order History</div>
        <h1 style={{ fontSize: 44, marginTop: 4 }}>ご注文履歴</h1>
      </div>

      <div style={{ padding: "28px 44px", overflow: "auto" }}>
        <div className="flex gap-2.5 mb-5 text-xs">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="border-none cursor-pointer"
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: filter === s ? "var(--sd-forest)" : "transparent",
                color: filter === s ? "var(--sd-paper)" : "var(--sd-ink-2)",
                border: filter === s ? "none" : "var(--sd-line)",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "var(--sd-ink-3)" }}>
              {["注文番号", "日付", "内容", "金額", "状態", ""].map((h) => (
                <th
                  key={h}
                  className="text-left"
                  style={{ padding: "12px 0", fontFamily: "var(--font-serif-jp)", fontWeight: 500, borderBottom: "var(--sd-line-strong)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} style={{ borderBottom: "var(--sd-line)" }}>
                <td className="mono" style={{ padding: "18px 0", fontSize: 11 }}>{o.order_no}</td>
                <td className="mono" style={{ padding: "18px 0" }}>
                  {new Date(o.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".")}
                </td>
                <td style={{ padding: "18px 0", fontFamily: "var(--font-serif-jp)" }}>
                  {o.items[0]?.name_jp || o.items[0]?.name}{o.items.length > 1 ? ` ほか ${o.items.length - 1} 品` : ""}
                </td>
                <td className="mono" style={{ padding: "18px 0" }}>¥{o.total.toLocaleString()}</td>
                <td style={{ padding: "18px 0" }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 2,
                      color: statusColor(o.status),
                      background: `color-mix(in oklab, ${statusColor(o.status)} 10%, transparent)`,
                    }}
                  >
                    {o.status}
                  </span>
                </td>
                {/* BUG: #13 — 注文詳細へのリンク。RLSで他ユーザーの注文もアクセス可能 */}
                <td className="text-right" style={{ padding: "18px 0", fontSize: 11, color: "var(--sd-ink-3)" }}>
                  <Link href={`/orders/${o.id}`} className="no-underline" style={{ color: "var(--sd-ink-3)" }}>
                    詳細 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <h3 style={{ fontFamily: "var(--font-serif-jp)", fontSize: 22 }}>まだご注文はありません。</h3>
            <div className="en mt-1.5" style={{ fontSize: 10 }}>No orders yet.</div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}

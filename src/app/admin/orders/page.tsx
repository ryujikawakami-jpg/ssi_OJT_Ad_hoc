"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/lib/types";

const STATUS_OPTIONS = ["すべて", "処理中", "発送済", "配送中", "お届け済", "キャンセル"];
const tagColor: Record<string, string> = {
  処理中: "var(--sd-ochre)",
  発送済: "var(--sd-moss)",
  配送中: "var(--sd-sage)",
  "お届け済": "var(--sd-moss)",
  キャンセル: "var(--sd-wine)",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("すべて");
  const [startDate, setStartDate] = useState("2025-09-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  };

  const filtered = useMemo(() => {
    let result = [...orders];

    if (filter !== "すべて") {
      result = result.filter((o) => o.status === filter);
    }

    // BUG: #19 — 日付範囲フィルタで終了日を指定しても、その日付の注文が含まれない
    // 終了日が排他的（< ではなく <= にすべき）
    result = result.filter((o) => {
      const d = o.created_at.split("T")[0];
      return d >= startDate && d < endDate; // BUG: should be <=
    });

    return result;
  }, [orders, filter, startDate, endDate]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { すべて: orders.length };
    STATUS_OPTIONS.slice(1).forEach((s) => {
      counts[s] = orders.filter((o) => o.status === s).length;
    });
    return counts;
  }, [orders]);

  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter((o) => o.created_at.startsWith(today));
    return {
      count: todayOrders.length,
      amount: todayOrders.reduce((s, o) => s + o.total, 0),
    };
  }, [orders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // BUG: #16 — キャンセルに変更しても在庫数が戻らない
    // stock += qty の処理が抜けている
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    loadOrders();
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end" style={{ padding: "22px 36px", borderBottom: "var(--sd-line)" }}>
        <div>
          <div className="en-caps">Orders</div>
          <h1 style={{ fontSize: 26, marginTop: 2 }}>注文管理</h1>
        </div>
        <div className="mono text-xs" style={{ color: "var(--sd-ink-3)" }}>
          本日 {todayTotal.count} 件 / ¥{todayTotal.amount.toLocaleString()}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-6 items-center text-xs" style={{ padding: "18px 36px", borderBottom: "var(--sd-line)" }}>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="border-none cursor-pointer"
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: filter === s ? "1px solid var(--sd-forest)" : "var(--sd-line)",
                color: filter === s ? "var(--sd-paper)" : "var(--sd-ink-2)",
                background: filter === s ? "var(--sd-forest)" : "transparent",
              }}
            >
              {s} <span className="mono ml-1" style={{ opacity: 0.7 }}>{statusCounts[s] || 0}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 items-center" style={{ color: "var(--sd-ink-3)" }}>
          <span>期間:</span>
          <input
            type="date"
            className="mono"
            style={{ padding: "4px 10px", border: "var(--sd-line)", background: "transparent", fontSize: 11 }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span>→</span>
          <input
            type="date"
            className="mono"
            style={{ padding: "4px 10px", border: "var(--sd-line)", background: "transparent", fontSize: 11 }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--sd-paper)" }}>
              {["注文番号", "顧客", "日時", "金額", "状態", "操作"].map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: i === 3 ? "right" : "left",
                    padding: "14px 24px",
                    fontFamily: "var(--font-serif-jp)",
                    fontWeight: 500,
                    color: "var(--sd-ink-2)",
                    borderBottom: "var(--sd-line-strong)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const color = tagColor[o.status] || "var(--sd-ink-3)";
              return (
                <tr key={o.id} style={{ borderBottom: "var(--sd-line)" }}>
                  <td className="mono" style={{ padding: "14px 24px", fontSize: 11 }}>{o.order_no}</td>
                  <td style={{ padding: "14px 24px", fontFamily: "var(--font-serif-jp)" }}>{o.user_name}</td>
                  <td className="mono" style={{ padding: "14px 24px", color: "var(--sd-ink-3)" }}>
                    {new Date(o.created_at).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="mono text-right" style={{ padding: "14px 24px" }}>
                    ¥{o.total.toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 24px" }}>
                    <span className="inline-flex items-center gap-1.5" style={{ color }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 24px" }}>
                    {/* BUG: #16 — ステータス変更時に在庫を戻さない */}
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="bg-transparent text-xs"
                      style={{ border: "var(--sd-line)", padding: "4px 8px", color: "var(--sd-ink-2)" }}
                    >
                      {STATUS_OPTIONS.slice(1).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

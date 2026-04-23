"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Order, Product } from "@/lib/types";

const PERIODS = ["今日", "7日間", "30日間", "90日間", "今年"];

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [period, setPeriod] = useState("30日間");

  useEffect(() => {
    const load = async () => {
      const [{ data: od }, { data: pd }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*"),
      ]);
      if (od) setOrders(od as Order[]);
      if (pd) setProducts(pd as Product[]);
    };
    load();
  }, []);

  const periodDays = useMemo(() => {
    switch (period) {
      case "今日": return 1;
      case "7日間": return 7;
      case "30日間": return 30;
      case "90日間": return 90;
      case "今年": return 365;
      default: return 30;
    }
  }, [period]);

  const filteredOrders = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, periodDays]);

  // BUG: #12 — 月別売上合計が個別注文の合計と一致しない
  // キャンセル注文を除外していない
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((s, o) => s + o.total, 0);
  }, [filteredOrders]);

  const orderCount = filteredOrders.length;
  const avgOrder = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  // Daily bars
  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 0; i < Math.min(periodDays, 30); i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days[key] = 0;
    }
    // BUG: #12 — キャンセル注文も売上に含まれてしまう
    filteredOrders.forEach((o) => {
      const key = o.created_at.split("T")[0];
      if (days[key] !== undefined) {
        days[key] += o.total;
      }
    });
    return Object.entries(days).sort().map(([date, amount]) => ({ date, amount }));
  }, [filteredOrders, periodDays]);

  const maxBar = Math.max(...dailyData.map((d) => d.amount), 1);

  // Top sellers
  const topSellers = useMemo(() => {
    const sales: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!sales[item.product_id]) {
          sales[item.product_id] = { name: item.name_jp, qty: 0, revenue: 0 };
        }
        sales[item.product_id].qty += item.quantity;
        sales[item.product_id].revenue += item.price * item.quantity;
      });
    });
    return Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders]);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end" style={{ padding: "22px 36px", borderBottom: "var(--sd-line)" }}>
        <div>
          <div className="en-caps">Reports</div>
          <h1 style={{ fontSize: 26, marginTop: 2 }}>売上レポート</h1>
        </div>
        <div className="flex gap-2 text-xs">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="border-none cursor-pointer"
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: period === p ? "1px solid var(--sd-forest)" : "var(--sd-line)",
                color: period === p ? "var(--sd-paper)" : "var(--sd-ink-2)",
                background: period === p ? "var(--sd-forest)" : "transparent",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-8" style={{ padding: "28px 36px", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "var(--sd-line)" }}>
        <Metric en="Gross revenue" jp="売上" v={`¥ ${totalRevenue.toLocaleString()}`} />
        <Metric en="Orders" jp="注文件数" v={String(orderCount)} />
        <Metric en="Average order" jp="平均単価" v={`¥ ${avgOrder.toLocaleString()}`} />
        <Metric en="Products" jp="商品数" v={String(products.length)} />
      </div>

      {/* Chart + Top sellers */}
      <div className="grid gap-7 flex-1" style={{ padding: "28px 36px", gridTemplateColumns: "1.6fr 1fr", minHeight: 0 }}>
        {/* Chart */}
        <div className="flex flex-col" style={{ border: "var(--sd-line)", padding: 24, background: "var(--sd-paper)" }}>
          <div className="flex justify-between items-baseline">
            <div>
              <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 16 }}>日別売上</div>
              <div className="en-caps" style={{ fontSize: 9 }}>Daily Revenue</div>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>¥ thousands</div>
          </div>

          <div className="flex-1 mt-5 relative flex items-end gap-1" style={{ minHeight: 200 }}>
            {dailyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  style={{
                    width: "100%",
                    height: `${(d.amount / maxBar) * 100}%`,
                    minHeight: d.amount > 0 ? 2 : 0,
                    background: i === dailyData.length - 1 ? "var(--sd-forest)" : "var(--sd-moss)",
                    opacity: i === dailyData.length - 1 ? 1 : 0.5 + (i / dailyData.length) * 0.5,
                  }}
                />
                {/* BUG: #4 — X軸ラベルが日付ではなくインデックス番号で表示される */}
                {i % 5 === 0 && (
                  <span className="mono" style={{ fontSize: 9, color: "var(--sd-ink-4)" }}>
                    {i}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top sellers */}
        <div className="flex flex-col" style={{ border: "var(--sd-line)", padding: 24 }}>
          <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 16 }}>よく売れている品</div>
          <div className="en-caps" style={{ fontSize: 9 }}>Top Sellers</div>

          <div className="grid gap-3.5 mt-5 text-xs">
            {topSellers.map((item, i) => (
              <div
                key={item.name}
                className="grid items-baseline gap-2.5"
                style={{
                  gridTemplateColumns: "24px 1fr auto",
                  paddingBottom: 12,
                  borderBottom: i === topSellers.length - 1 ? "none" : "var(--sd-line)",
                }}
              >
                <span className="mono" style={{ color: "var(--sd-ink-4)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div style={{ fontFamily: "var(--font-serif-jp)" }}>{item.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--sd-ink-4)" }}>× {item.qty} 点</div>
                </div>
                <span className="mono">¥{item.revenue.toLocaleString()}</span>
              </div>
            ))}
            {topSellers.length === 0 && (
              <div className="text-center py-8" style={{ color: "var(--sd-ink-3)" }}>
                データがありません
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({ en, jp, v }: { en: string; jp: string; v: string }) {
  return (
    <div>
      <div className="en-caps" style={{ fontSize: 9 }}>{en}</div>
      <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 13, color: "var(--sd-ink-2)", marginTop: 2 }}>{jp}</div>
      <div className="mono" style={{ fontSize: 30, marginTop: 8 }}>{v}</div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import ProductImage from "@/components/ProductImage";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const CATEGORIES = ["すべて", "陶器", "木工", "テキスタイル", "金工", "ガラス", "家具"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("すべて");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("updated_at", { ascending: false });
    if (data) setProducts(data as Product[]);
  };

  const filtered = products.filter((p) => {
    if (filter !== "すべて" && p.category !== filter) return false;
    if (search && !p.name_jp.includes(search) && !p.sku.includes(search)) return false;
    return true;
  });

  const counts = {
    published: products.filter((p) => p.status === "公開").length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    draft: products.filter((p) => p.status === "下書き").length,
  };

  const handleSave = async (id: string) => {
    // BUG: #8 — 価格に小数点以下3桁以上の値を登録できる
    // step未設定、Math.round(x*100)/100 チェックなし
    const price = parseFloat(editPrice);
    const stock = parseInt(editStock, 10);
    await supabase.from("products").update({ price, stock }).eq("id", id);
    setEditingId(null);
    loadProducts();
  };

  const statusStyle = (s: string) => {
    switch (s) {
      case "公開":
        return { bg: "color-mix(in oklab, var(--sd-moss) 12%, transparent)", fg: "var(--sd-moss)" };
      case "下書き":
        return { bg: "transparent", fg: "var(--sd-ink-3)", border: "var(--sd-line)" };
      case "入荷待":
        return { bg: "color-mix(in oklab, var(--sd-wine) 12%, transparent)", fg: "var(--sd-wine)" };
      default:
        return { bg: "transparent", fg: "var(--sd-ink-3)" };
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: "22px 36px", borderBottom: "var(--sd-line)" }}>
        <div>
          <div className="en-caps">Catalog</div>
          <h1 style={{ fontSize: 26, marginTop: 2 }}>商品管理</h1>
        </div>
        <div className="flex gap-2.5">
          <button className="sd-btn sd-btn--ghost" disabled style={{ opacity: 0.4, cursor: "not-allowed", borderColor: "var(--sd-ink-4)", color: "var(--sd-ink-4)" }}>CSV書き出し</button>
          <button className="sd-btn sd-btn--primary" disabled style={{ opacity: 0.4, cursor: "not-allowed", background: "var(--sd-stone)", color: "var(--sd-ink-4)" }}>＋ 商品を追加</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-6" style={{ padding: "22px 36px", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "var(--sd-line)" }}>
        <KPI label="公開中の商品" en="Published" v={String(counts.published).padStart(3, "0")} />
        <KPI label="在庫切れ" en="Out of stock" v={String(counts.outOfStock).padStart(2, "0")} d="要補充" />
        <KPI label="下書き" en="Drafts" v={String(counts.draft).padStart(2, "0")} />
        <KPI label="全商品" en="Total" v={String(products.length).padStart(3, "0")} />
      </div>

      {/* Filter */}
      <div className="flex gap-4 items-center text-xs" style={{ padding: "16px 36px", borderBottom: "var(--sd-line)" }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <input className="sd-input" placeholder="商品名・SKUで検索" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className="border-none cursor-pointer"
            style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 12,
              border: filter === c ? "1px solid var(--sd-forest)" : "var(--sd-line)",
              color: filter === c ? "var(--sd-paper)" : "var(--sd-ink-2)",
              background: filter === c ? "var(--sd-forest)" : "transparent",
            }}
          >
            {c} {products.filter((p) => c === "すべて" || p.category === c).length}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--sd-paper)" }}>
              {["", "商品", "SKU", "カテゴリ", "価格", "在庫", "ステータス", ""].map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: i >= 4 && i <= 5 ? "right" : "left",
                    padding: "14px 16px",
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
            {filtered.map((p) => {
              const ss = statusStyle(p.status);
              const isEditing = editingId === p.id;
              return (
                <tr key={p.id} style={{ borderBottom: "var(--sd-line)" }}>
                  <td style={{ padding: "12px 16px", width: 64 }}>
                    <ProductImage label="" tonal={p.tonal} height={44} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 14 }}>{p.name_jp}</div>
                    <div className="en" style={{ fontSize: 9, marginTop: 2 }}>{p.name_en}</div>
                  </td>
                  <td className="mono" style={{ padding: "12px 16px", fontSize: 11, color: "var(--sd-ink-3)" }}>{p.sku}</td>
                  <td style={{ padding: "12px 16px", color: "var(--sd-ink-2)" }}>{p.category}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {isEditing ? (
                      /* BUG: #8 — step未設定、小数3桁以上入力可能 */
                      <input
                        className="sd-input mono"
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        style={{ width: 100, textAlign: "right" }}
                      />
                    ) : (
                      <span className="mono">¥{p.price.toLocaleString()}</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {isEditing ? (
                      <input
                        className="sd-input mono"
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        style={{ width: 60, textAlign: "right" }}
                      />
                    ) : (
                      <span
                        className="mono"
                        style={{ color: p.stock === 0 ? "var(--sd-wine)" : p.stock < 5 ? "var(--sd-ochre)" : "var(--sd-ink)" }}
                      >
                        {String(p.stock).padStart(3, "0")}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-sans-jp)",
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        padding: "3px 10px",
                        borderRadius: 2,
                        background: ss.bg,
                        color: ss.fg,
                        border: ss.border || "none",
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--sd-ink-3)", fontSize: 11, whiteSpace: "nowrap" }}>
                    {isEditing ? (
                      <button className="sd-btn sd-btn--primary" style={{ padding: "4px 12px", fontSize: 11 }} onClick={() => handleSave(p.id)}>
                        保存
                      </button>
                    ) : (
                      <button
                        className="bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--sd-ink-3)", fontSize: 11 }}
                        onClick={() => {
                          setEditingId(p.id);
                          setEditPrice(String(p.price));
                          setEditStock(String(p.stock));
                        }}
                      >
                        編集 · 複製 · 非公開
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between text-xs" style={{ borderTop: "var(--sd-line)", padding: "14px 36px", color: "var(--sd-ink-3)" }}>
        <span className="mono">{filtered.length} / {products.length} 件</span>
      </div>
    </>
  );
}

function KPI({ label, en, v, d }: { label: string; en: string; v: string; d?: string }) {
  return (
    <div>
      <div className="en-caps" style={{ fontSize: 9 }}>{en}</div>
      <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 13, color: "var(--sd-ink-2)", marginTop: 2 }}>{label}</div>
      <div className="mono" style={{ fontSize: 30, marginTop: 8, color: "var(--sd-forest)" }}>{v}</div>
      {d && <div className="mt-1" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>{d}</div>}
    </div>
  );
}

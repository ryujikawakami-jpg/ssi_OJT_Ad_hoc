"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import StoreLayout from "@/components/StoreLayout";
import ProductImage from "@/components/ProductImage";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const CATEGORIES = ["すべて", "陶器", "木工", "テキスタイル", "金工", "ガラス", "家具"];

type SortKey = "newest" | "price_asc" | "price_desc";

export default function ProductListingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("すべて");
  const [sort, setSort] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");

  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const load = async (retries = 2) => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "公開")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Products fetch error:", error);
        if (retries > 0) {
          setTimeout(() => load(retries - 1), 1500);
          return;
        }
        setFetchError(true);
        return;
      }
      if (data) {
        setProducts(data as Product[]);
        setFetchError(false);
      }
    };
    load();
  }, []);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    // BUG: #18 — カテゴリ「すべて」に戻すと直前の価格ソートがリセットされる
    if (cat === "すべて") {
      setSort("newest"); // ソートもリセットしてしまう
    }
  };

  const filtered = useMemo(() => {
    let result = [...products];

    // Search filter
    if (search) {
      // BUG: #20 — 検索に特殊文字（%, _）を入力すると全件表示される
      // SQLのLIKE用エスケープをしていないため、%や_が全件マッチする
      result = result.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name_jp.toLowerCase().includes(q) ||
          p.name_en.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      });
    }

    // Category filter
    if (category !== "すべて") {
      result = result.filter((p) => p.category === category);
    }

    // Sort
    switch (sort) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, category, sort, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { すべて: products.length };
    CATEGORIES.slice(1).forEach((c) => {
      counts[c] = products.filter((p) => p.category === c).length;
    });
    return counts;
  }, [products]);

  return (
    <StoreLayout>
      {/* Header */}
      <div style={{ padding: "44px 44px 24px", borderBottom: "var(--sd-line)" }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--sd-ink-4)" }}>
          ホーム / ショップ
        </div>
        <div className="flex justify-between items-end mt-4">
          <div>
            <div className="en-caps">The Shop · Spring</div>
            <h1 style={{ fontSize: 56, marginTop: 4 }}>四月のはじまり</h1>
            <p className="mt-3.5 text-sm" style={{ color: "var(--sd-ink-2)", maxWidth: 520 }}>
              土と布と木。あたらしい季節に、手に馴染むものを。産地を訪ね、つくり手の言葉と共にお届けします。
            </p>
          </div>
          <div className="text-right">
            <div className="mono" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>
              {filtered.length} 件 · ITEMS
            </div>
            <div className="mt-2.5 text-xs" style={{ color: "var(--sd-ink-2)" }}>
              並び替え:{" "}
              {(["newest", "price_asc", "price_desc"] as SortKey[]).map((s, i) => {
                const labels = { newest: "新着順", price_asc: "価格 ↑", price_desc: "価格 ↓" };
                return (
                  <span key={s}>
                    {i > 0 && " · "}
                    <button
                      onClick={() => setSort(s)}
                      className="bg-transparent border-none cursor-pointer"
                      style={{
                        color: sort === s ? "var(--sd-forest)" : "inherit",
                        textDecoration: sort === s ? "underline" : "none",
                        textUnderlineOffset: 3,
                      }}
                    >
                      {labels[s]}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid flex-1" style={{ gridTemplateColumns: "200px 1fr", minHeight: 0 }}>
        {/* Sidebar filters */}
        <aside className="text-xs" style={{ padding: "32px 0 32px 44px", borderRight: "var(--sd-line)" }}>
          {/* Search */}
          <div className="mb-6" style={{ paddingRight: 24 }}>
            <input
              className="sd-input"
              placeholder="キーワード検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: 12 }}
            />
          </div>

          {/* Categories */}
          <div style={{ marginBottom: 28, paddingRight: 24 }}>
            <div className="flex items-baseline justify-between" style={{ borderBottom: "var(--sd-line)", paddingBottom: 8 }}>
              <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 14 }}>カテゴリ</div>
              <span className="en-caps" style={{ fontSize: 8 }}>Category</span>
            </div>
            <ul className="list-none p-0 m-0 grid gap-1.5 mt-3">
              {CATEGORIES.map((cat) => (
                <li
                  key={cat}
                  className="flex justify-between cursor-pointer"
                  style={{ color: category === cat ? "var(--sd-forest)" : "var(--sd-ink-2)" }}
                  onClick={() => handleCategoryChange(cat)}
                >
                  <span>{category === cat && "· "}{cat}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--sd-ink-4)" }}>
                    {categoryCounts[cat] || 0}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <div style={{ padding: "32px 44px", overflow: "auto" }}>
          <div className="grid gap-7" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {filtered.map((p, i) => (
              <Link href={`/products/${p.id}`} key={p.id} className="no-underline text-inherit">
                <article>
                  <ProductImage
                    label={`NO. ${String(i + 1).padStart(2, "0")}`}
                    subLabel={p.name_en.toUpperCase()}
                    tonal={p.tonal}
                    height={260}
                  >
                    {p.stock === 0 && <span className="sd-tag sd-tag--wine">入荷待ち</span>}
                    {p.stock > 0 && p.stock <= 5 && <span className="sd-tag sd-tag--sage">在庫わずか</span>}
                  </ProductImage>
                  <div className="mt-3.5">
                    {/* BUG: #1 — 商品名が長い場合に折り返されず、カードからはみ出す */}
                    <div
                      style={{
                        fontFamily: "var(--font-serif-jp)",
                        fontSize: 15,
                        whiteSpace: "nowrap",
                        overflow: "visible",
                      }}
                    >
                      {p.name_jp}
                    </div>
                    <div className="en" style={{ marginTop: 4, fontSize: 9 }}>{p.name_en}</div>
                    <div className="flex justify-between items-baseline mt-2.5">
                      <span className="mono" style={{ fontSize: 13, color: "var(--sd-ink)" }}>
                        ¥{p.price.toLocaleString()}
                      </span>
                      <span className="en-caps" style={{ fontSize: 9 }}>View →</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          {fetchError && (
            <div className="text-center py-20">
              <div className="mono" style={{ fontSize: 12, color: "var(--sd-ink-4)", letterSpacing: "0.2em" }}>— 500 —</div>
              <h3 style={{ fontFamily: "var(--font-serif-jp)", fontSize: 22, marginTop: 14 }}>商品の読み込みに失敗しました。</h3>
              <p className="mt-3 text-sm" style={{ color: "var(--sd-ink-2)" }}>少し時間をおいて、ページを再読み込みしてください。</p>
              <button className="sd-btn sd-btn--primary mt-5" onClick={() => window.location.reload()}>再読み込み</button>
            </div>
          )}
          {!fetchError && filtered.length === 0 && products.length === 0 && (
            <div className="text-center py-20">
              <div className="sd-skel" style={{ width: 200, height: 14, margin: "0 auto" }} />
              <div className="sd-skel mt-3" style={{ width: 140, height: 10, margin: "0 auto" }} />
            </div>
          )}
          {!fetchError && filtered.length === 0 && products.length > 0 && (
            <div className="text-center py-20">
              <h3 style={{ fontFamily: "var(--font-serif-jp)", fontSize: 22 }}>該当する品がありませんでした。</h3>
              <div className="en mt-1.5" style={{ fontSize: 10 }}>Nothing matches — try another word.</div>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}

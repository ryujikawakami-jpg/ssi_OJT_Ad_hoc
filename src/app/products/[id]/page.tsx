"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import StoreLayout from "@/components/StoreLayout";
import ProductImage from "@/components/ProductImage";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/lib/types";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).single();
      if (data) setProduct(data as Product);
    };
    load();
  }, [id]);

  if (!product) {
    return (
      <StoreLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="sd-skel" style={{ width: 200, height: 20 }} />
        </div>
      </StoreLayout>
    );
  }

  const handleAdd = () => {
    // BUG: #6 — 数量に0以下の値を入力できる（マイナス値でカートに追加できる）
    // qty > 0 の判定なし
    // BUG: #2 — 在庫数を超える数量でもカートに追加できる（qty <= stock の判定なし）
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // 在庫表示（正しい実装）
  const stockLabel = product.stock > 5 ? "在庫あり" : product.stock > 0 ? "在庫わずか" : "入荷待ち";
  const stockColor = product.stock > 5 ? "var(--sd-moss)" : product.stock > 0 ? "var(--sd-ochre)" : "var(--sd-wine)";

  // BUG: #17 — 在庫0でも「カートに追加」ボタンが押せてカートに入る
  // disabled 条件に stock <= 0 を含めていない
  const isAddDisabled = false;

  return (
    <StoreLayout>
      <div className="mono" style={{ padding: "20px 44px", fontSize: 10, color: "var(--sd-ink-4)" }}>
        ホーム / ショップ / {product.category} / {product.name_jp}
      </div>

      <div className="grid flex-1" style={{ gridTemplateColumns: "1.15fr 1fr", minHeight: 0 }}>
        {/* Images */}
        <div style={{ padding: "0 44px 44px" }}>
          <ProductImage
            label={product.origin?.toUpperCase() || ""}
            subLabel={product.name_en.toUpperCase()}
            tonal={product.tonal}
            height={520}
          />
          <div className="grid gap-2.5 mt-2.5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {["d", "g", "a", "c"].map((t, i) => (
              <ProductImage key={i} label={`VIEW ${i + 1}`} tonal={t} height={90} />
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "0 56px 44px 20px", overflow: "auto" }}>
          <div className="en-caps">{product.name_en}</div>
          <h1 style={{ fontSize: 42, marginTop: 6, letterSpacing: "0.03em" }}>
            {product.name_jp}
          </h1>
          <div className="flex gap-2.5 mt-3.5">
            <span className="sd-tag sd-tag--sage" style={{ color: stockColor, borderColor: stockColor }}>{stockLabel}</span>
            <span className="sd-tag">産地 · {product.origin}</span>
          </div>

          <div className="flex items-baseline gap-3.5 mt-7">
            <span className="mono" style={{ fontSize: 28, color: "var(--sd-ink)" }}>
              ¥{product.price.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: "var(--sd-ink-4)" }}>税込 · 送料別</span>
          </div>

          <p className="mt-6 text-sm leading-8" style={{ color: "var(--sd-ink-2)" }}>
            {product.description}
          </p>

          {/* Specs */}
          {product.specs && (
            <div
              className="grid gap-4 mt-7"
              style={{ borderTop: "var(--sd-line)", paddingTop: 20, gridTemplateColumns: "1fr 1fr", fontSize: 12 }}
            >
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key}>
                  <div className="en-caps" style={{ fontSize: 9 }}>{key}</div>
                  <div style={{ marginTop: 4, fontFamily: "var(--font-serif-jp)", fontSize: 14 }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-end gap-4 mt-8">
            <div>
              <label className="sd-field-label">数量 · Quantity</label>
              <div className="inline-flex" style={{ border: "var(--sd-line-strong)", borderRadius: 2 }}>
                {/* BUG: #6 — min属性なし。マイナスにもできる */}
                {/* BUG: #2 — 在庫数を超える数量を指定できる（max制限なし） */}
                <button
                  onClick={() => setQuantity((q) => q - 1)}
                  className="bg-transparent border-none cursor-pointer"
                  style={{ padding: "12px 16px", fontSize: 14, color: "var(--sd-ink)" }}
                >
                  −
                </button>
                <span
                  className="mono"
                  style={{
                    padding: "12px 16px",
                    borderLeft: "var(--sd-line)",
                    borderRight: "var(--sd-line)",
                    minWidth: 50,
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="bg-transparent border-none cursor-pointer"
                  style={{ padding: "12px 16px", fontSize: 14, color: "var(--sd-ink)" }}
                >
                  +
                </button>
              </div>
            </div>
            {/* BUG: #17 — 在庫0でもボタンが有効 */}
            <button
              className="sd-btn sd-btn--primary flex-1"
              style={{ padding: "18px" }}
              onClick={handleAdd}
              disabled={isAddDisabled}
            >
              {added ? "追加しました ✓" : "カートに入れる"} <span className="arr">→</span>
            </button>
          </div>
          <div className="mt-2.5" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>
            残り {product.stock} 点 · 11,000円以上のご注文で送料無料
          </div>

          <div className="grid gap-2.5 mt-9 text-xs" style={{ borderTop: "var(--sd-line)", paddingTop: 18, color: "var(--sd-ink-2)" }}>
            <div>お届け目安: 3〜5営業日</div>
            <div>2年保証付 · 修理相談可</div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

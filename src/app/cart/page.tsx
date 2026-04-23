"use client";

import Link from "next/link";
import StoreLayout from "@/components/StoreLayout";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const shipping = items.length > 0 ? 680 : 0;
  const total = subtotal + shipping - couponDiscount;

  const applyCoupon = async () => {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("active", true)
      .single();
    if (data) {
      setCouponDiscount(data.discount_amount);
      setCouponApplied(true);
    }
  };

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div
            className="flex items-center justify-center"
            style={{
              width: 48, height: 48, border: "1px solid var(--sd-lichen)",
              borderRadius: "50%", fontFamily: "var(--font-serif-en)", fontStyle: "italic", color: "var(--sd-lichen)",
            }}
          >
            Ø
          </div>
          <h3 style={{ fontFamily: "var(--font-serif-jp)", fontSize: 22, marginTop: 18 }}>かごの中は空です。</h3>
          <div className="en mt-1.5" style={{ fontSize: 10 }}>Your basket is empty.</div>
          <p className="mt-3.5 text-sm" style={{ color: "var(--sd-ink-2)" }}>
            季節の新入荷からお選びいただけます。
          </p>
          <Link href="/products" className="sd-btn sd-btn--ghost mt-4 no-underline">
            ショップを見る <span className="arr">→</span>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div style={{ padding: "44px 44px 20px", borderBottom: "var(--sd-line)" }}>
        <div className="en-caps">Your Basket</div>
        <h1 style={{ fontSize: 44, marginTop: 4 }}>買い物かご</h1>
        <div className="mono mt-2" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>
          {items.length} 品 · {items.reduce((s, i) => s + i.quantity, 0)} 点
        </div>
      </div>

      <div className="grid flex-1" style={{ gridTemplateColumns: "1.6fr 1fr", minHeight: 0 }}>
        {/* Items */}
        <div style={{ padding: "28px 44px", overflow: "auto" }}>
          {items.map((item, i) => (
            <div
              key={item.product.id}
              className="grid gap-5"
              style={{ gridTemplateColumns: "120px 1fr auto", padding: "22px 0", borderBottom: "var(--sd-line)" }}
            >
              <ProductImage label={`NO. ${String(i + 1).padStart(2, "0")}`} tonal={item.product.tonal} height={120} />
              <div className="flex flex-col justify-between">
                <div>
                  <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 17 }}>{item.product.name_jp}</div>
                  <div className="en mt-1" style={{ fontSize: 9 }}>{item.product.name_en}</div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span style={{ color: "var(--sd-ink-2)" }}>
                    数量{" "}
                    <span className="mono" style={{ marginLeft: 8, border: "var(--sd-line)", padding: "2px 10px" }}>
                      <button className="bg-transparent border-none cursor-pointer" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>−</button>
                      {" "}{item.quantity}{" "}
                      <button className="bg-transparent border-none cursor-pointer" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                    </span>
                  </span>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="bg-transparent border-none cursor-pointer"
                    style={{ color: "var(--sd-ink-3)", textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className="text-right">
                {/* BUG: #10 — 小計が単価×個数ではなく単価のみ表示される */}
                <div className="mono" style={{ fontSize: 16 }}>
                  ¥{item.product.price.toLocaleString()}
                </div>
                <div className="mono mt-1" style={{ fontSize: 10, color: "var(--sd-ink-4)" }}>
                  @ ¥{item.product.price.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ padding: "28px 44px 28px 36px", borderLeft: "var(--sd-line)", background: "var(--sd-paper)" }}>
          <div className="en-caps">Summary</div>
          <h2 style={{ fontSize: 22, marginTop: 4 }}>ご注文内容</h2>

          <div className="grid gap-3.5 mt-6 text-sm">
            <SummaryRow label="小計" en="Subtotal" value={`¥${subtotal.toLocaleString()}`} />
            <SummaryRow label="配送料" en="Shipping" value={`¥${shipping.toLocaleString()}`} />
            <SummaryRow label="割引" en="Discount" value={couponDiscount > 0 ? `— ¥${couponDiscount.toLocaleString()}` : "— ¥0"} muted />
          </div>

          <div
            className="flex justify-between items-baseline"
            style={{ borderTop: "var(--sd-line-strong)", marginTop: 20, paddingTop: 18 }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 17 }}>合計</div>
              <div className="en-caps" style={{ fontSize: 9 }}>Total · tax incl.</div>
            </div>
            <div className="mono" style={{ fontSize: 26 }}>¥{total.toLocaleString()}</div>
          </div>

          <div className="flex mt-5" style={{ border: "var(--sd-line-strong)" }}>
            <input
              className="sd-input"
              placeholder="クーポンコード"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              style={{ border: "none", padding: "10px 14px" }}
            />
            <button className="sd-btn sd-btn--quiet" style={{ borderLeft: "var(--sd-line)" }} onClick={applyCoupon}>
              適用
            </button>
          </div>
          {couponApplied && (
            <div className="mt-2 text-xs" style={{ color: "var(--sd-moss)" }}>
              ✓ クーポンを適用しました（— ¥{couponDiscount.toLocaleString()}）
            </div>
          )}

          <Link href="/checkout" className="sd-btn sd-btn--primary w-full mt-4 no-underline" style={{ padding: "18px" }}>
            レジに進む <span className="arr">→</span>
          </Link>
          <Link
            href="/products"
            className="block text-center mt-3.5 text-xs no-underline"
            style={{ color: "var(--sd-ink-2)", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            買い物を続ける
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}

function SummaryRow({ label, en, value, muted }: { label: string; en: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between items-baseline" style={{ color: muted ? "var(--sd-ink-3)" : "var(--sd-ink)" }}>
      <span>
        <span style={{ fontFamily: "var(--font-serif-jp)" }}>{label}</span>
        <span className="en ml-1.5" style={{ fontSize: 9 }}>{en}</span>
      </span>
      <span className="mono">{value}</span>
    </div>
  );
}

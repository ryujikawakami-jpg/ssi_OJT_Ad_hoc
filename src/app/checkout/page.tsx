"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StoreLayout from "@/components/StoreLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "pickup">("standard");

  const shippingCost = shippingMethod === "standard" ? 680 : shippingMethod === "express" ? 1280 : 0;

  // BUG: #11 — クーポン適用後の合計金額が割引前の金額と同じになる
  // couponDiscount を引いていない
  const total = subtotal + shippingCost;

  // BUG: #15 — 二重注文防止なし（isSubmitting フラグなし）
  const handleOrder = async () => {
    if (!user) return;

    const orderNo = `SD-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;

    const orderItems = items.map((i) => ({
      product_id: i.product.id,
      name_jp: i.product.name_jp,
      name_en: i.product.name_en,
      price: i.product.price,
      quantity: i.quantity,
      tonal: i.product.tonal,
    }));

    await supabase.from("orders").insert({
      order_no: orderNo,
      user_id: user.id,
      user_name: user.name_jp,
      items: orderItems,
      subtotal,
      shipping: shippingCost,
      discount: couponDiscount,
      total,
      status: "処理中",
      shipping_address: user.address || "",
      payment_method: "VISA •••• 4213",
    });

    // Decrease stock
    for (const item of items) {
      await supabase.rpc("decrement_stock", { p_id: item.product.id, qty: item.quantity });
    }

    clearCart();
    router.push(`/checkout/complete?order=${orderNo}`);
  };

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

  const steps = [
    { n: "01", jp: "カート", en: "Cart", st: "done" },
    { n: "02", jp: "ご注文内容", en: "Review", st: "done" },
    { n: "03", jp: "お支払い", en: "Payment", st: "on" },
    { n: "04", jp: "完了", en: "Complete", st: "off" },
  ];

  return (
    <StoreLayout>
      {/* Progress */}
      <div className="flex gap-8 text-xs" style={{ padding: "20px 44px", borderBottom: "var(--sd-line)" }}>
        {steps.map((s) => (
          <div
            key={s.n}
            className="flex items-center gap-2.5"
            style={{ color: s.st === "on" ? "var(--sd-forest)" : s.st === "done" ? "var(--sd-ink-2)" : "var(--sd-ink-4)" }}
          >
            <span className="mono">{s.n}</span>
            <span>
              <span style={{ fontFamily: "var(--font-serif-jp)" }}>{s.jp}</span>
              <span className="en ml-1.5" style={{ fontSize: 9 }}>{s.en}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid flex-1" style={{ gridTemplateColumns: "1.6fr 1fr", minHeight: 0, overflow: "auto" }}>
        {/* Left: Form */}
        <div style={{ padding: "32px 44px" }}>
          <div className="en-caps">Payment & Details</div>
          <h1 style={{ fontSize: 36, marginTop: 4 }}>お支払いと配送</h1>

          {/* Shipping Address */}
          <section className="mt-7">
            <SectionTitle jp="お届け先" en="Ship To" />
            <div className="mt-3 p-4" style={{ border: "var(--sd-line)", background: "var(--sd-paper)" }}>
              <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 15 }}>{user?.name_jp || "佐藤 里香"} 様</div>
              <div className="mt-1.5 text-sm" style={{ color: "var(--sd-ink-2)" }}>
                {user?.address || "東京都 世田谷区 代沢 2-1-3"}
              </div>
              <div className="mono mt-1" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>
                {user?.phone || "090-1234-5678"}
              </div>
            </div>
          </section>

          {/* Shipping Method */}
          <section className="mt-7">
            <SectionTitle jp="お届け方法" en="Shipping Method" />
            <div className="grid gap-2.5 mt-3">
              {([
                { key: "standard", jp: "通常便", en: "Standard", desc: "3〜5営業日", fee: 680 },
                { key: "express", jp: "速達便", en: "Express", desc: "翌営業日", fee: 1280 },
                { key: "pickup", jp: "店頭受取", en: "Pickup", desc: "代沢店", fee: 0 },
              ] as const).map((m) => (
                <label
                  key={m.key}
                  className="grid items-center gap-3.5 cursor-pointer"
                  style={{
                    padding: 16,
                    border: shippingMethod === m.key ? "1px solid var(--sd-forest)" : "var(--sd-line)",
                    gridTemplateColumns: "20px 1fr auto",
                    background: shippingMethod === m.key ? "var(--sd-paper)" : "transparent",
                  }}
                  onClick={() => setShippingMethod(m.key)}
                >
                  <span
                    className="relative"
                    style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: `1px solid ${shippingMethod === m.key ? "var(--sd-forest)" : "var(--sd-ink-4)"}`,
                    }}
                  >
                    {shippingMethod === m.key && (
                      <span className="absolute" style={{ inset: 2, borderRadius: "50%", background: "var(--sd-forest)" }} />
                    )}
                  </span>
                  <div>
                    <span style={{ fontFamily: "var(--font-serif-jp)", fontSize: 14 }}>{m.jp}</span>
                    <span className="en ml-2" style={{ fontSize: 9 }}>{m.en}</span>
                    <div className="mt-0.5" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>{m.desc}</div>
                  </div>
                  <span className="mono text-sm">{m.fee === 0 ? "無料" : `¥${m.fee.toLocaleString()}`}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="mt-7">
            <SectionTitle jp="お支払い方法" en="Payment" />
            <div className="mt-3 p-4 grid gap-4" style={{ border: "var(--sd-line)", background: "var(--sd-paper)" }}>
              <div className="flex gap-4">
                {["クレジットカード", "銀行振込", "コンビニ払い", "代金引換"].map((p, i) => (
                  <span
                    key={p}
                    className="text-xs"
                    style={{
                      padding: "8px 14px",
                      border: i === 0 ? "1px solid var(--sd-forest)" : "var(--sd-line)",
                      color: i === 0 ? "var(--sd-forest)" : "var(--sd-ink-2)",
                      borderRadius: 2,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
                <div>
                  <label className="sd-field-label">カード番号</label>
                  <input className="sd-input" defaultValue="4213 •••• •••• ••••" />
                </div>
                <div>
                  <label className="sd-field-label">有効期限</label>
                  <input className="sd-input" defaultValue="08 / 28" />
                </div>
                <div>
                  <label className="sd-field-label">CVV</label>
                  <input className="sd-input" defaultValue="•••" />
                </div>
              </div>
            </div>
          </section>

          {/* Coupon */}
          <section className="mt-7">
            <SectionTitle jp="クーポン" en="Coupon" />
            <div className="flex mt-3" style={{ border: "var(--sd-line-strong)", maxWidth: 420 }}>
              <input
                className="sd-input mono"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="クーポンコード"
                style={{ border: "none", padding: "10px 14px" }}
              />
              <button className="sd-btn sd-btn--primary" style={{ borderRadius: 0, padding: "10px 20px" }} onClick={applyCoupon}>
                適用
              </button>
            </div>
            {couponApplied && (
              <div className="mt-2.5 text-xs" style={{ color: "var(--sd-moss)" }}>
                ✓ 「{couponCode.toUpperCase()}」を適用しました（— ¥{couponDiscount.toLocaleString()}）
              </div>
            )}
          </section>
        </div>

        {/* Right: Summary */}
        {/* BUG: #2 — 注文確認画面に商品明細が表示されない（金額サマリーのみ） */}
        <aside style={{ borderLeft: "var(--sd-line)", background: "var(--sd-paper)", padding: 32 }}>
          <div className="en-caps">Order Summary</div>
          <h3 style={{ fontSize: 18, marginTop: 4 }}>ご注文内容</h3>

          <div className="grid gap-3.5 mt-5 text-sm">
            <SummaryRow k="小計" en="Subtotal" v={`¥${subtotal.toLocaleString()}`} />
            <SummaryRow k="配送料" en="Shipping" v={`¥${shippingCost.toLocaleString()}`} />
            <SummaryRow k="クーポン" en="Coupon" v={couponDiscount > 0 ? `— ¥${couponDiscount.toLocaleString()}` : "— ¥0"} muted />
          </div>

          <div className="flex justify-between items-baseline" style={{ borderTop: "var(--sd-line-strong)", marginTop: 18, paddingTop: 16 }}>
            <span style={{ fontFamily: "var(--font-serif-jp)", fontSize: 17 }}>合計</span>
            {/* BUG: #11 — total にクーポン割引が反映されていない */}
            <span className="mono" style={{ fontSize: 26 }}>¥{total.toLocaleString()}</span>
          </div>

          {/* BUG: #15 — 二重送信防止なし */}
          <button
            className="sd-btn sd-btn--primary w-full mt-5"
            style={{ padding: "18px" }}
            onClick={handleOrder}
          >
            注文を確定する <span className="arr">→</span>
          </button>
          <p className="mt-3 leading-relaxed" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>
            ボタンを押した時点でご注文が確定します。利用規約・プライバシーポリシーに同意の上、お進みください。
          </p>
        </aside>
      </div>
    </StoreLayout>
  );
}

function SectionTitle({ jp, en }: { jp: string; en: string }) {
  return (
    <div className="flex items-baseline justify-between" style={{ borderBottom: "var(--sd-line)", paddingBottom: 8 }}>
      <div>
        <span style={{ fontFamily: "var(--font-serif-jp)", fontSize: 16 }}>{jp}</span>
        <span className="en-caps ml-2.5" style={{ fontSize: 9 }}>{en}</span>
      </div>
    </div>
  );
}

function SummaryRow({ k, en, v, muted }: { k: string; en: string; v: string; muted?: boolean }) {
  return (
    <div className="flex justify-between items-baseline" style={{ color: muted ? "var(--sd-ink-3)" : "var(--sd-ink)" }}>
      <span>
        <span style={{ fontFamily: "var(--font-serif-jp)" }}>{k}</span>
        <span className="en ml-1.5" style={{ fontSize: 9 }}>{en}</span>
      </span>
      <span className="mono">{v}</span>
    </div>
  );
}

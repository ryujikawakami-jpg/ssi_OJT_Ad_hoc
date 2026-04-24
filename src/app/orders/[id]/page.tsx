"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import StoreLayout from "@/components/StoreLayout";
import ProductImage from "@/components/ProductImage";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/lib/types";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const load = async () => {
      // BUG: #13 — 一般ユーザーが他人の注文履歴URLを直打ちでアクセスできる
      // user_id のフィルタリングをしていない
      const { data } = await supabase.from("orders").select("*").eq("id", id).single();
      if (data) setOrder(data as Order);
    };
    load();
  }, [id]);

  if (!order) {
    return (
      <StoreLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="sd-skel" style={{ width: 200, height: 20 }} />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div style={{ padding: "44px 44px 20px", borderBottom: "var(--sd-line)" }}>
        <div className="en-caps">Order Detail</div>
        <h1 style={{ fontSize: 36, marginTop: 4 }}>注文詳細</h1>
        <div className="mono mt-2" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>{order.order_no}</div>
      </div>

      <div className="grid flex-1" style={{ gridTemplateColumns: "1.2fr 1fr", gap: 56, padding: "32px 44px" }}>
        <div>
          <div className="grid gap-3.5 mt-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {order.items.map((item: any, i: number) => {
              const name = item.name_jp || item.name || "不明";
              const qty = item.quantity ?? item.qty ?? 0;
              return (
                <div key={i} className="grid items-center gap-3" style={{ gridTemplateColumns: "56px 1fr auto" }}>
                  <ProductImage label="" tonal={item.tonal || "a"} height={56} />
                  <div>
                    <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 13 }}>{name}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--sd-ink-4)", marginTop: 2 }}>× {qty}</div>
                  </div>
                  <span className="mono text-sm">¥{(item.price * qty).toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          <div className="grid gap-2 mt-5 text-xs" style={{ borderTop: "var(--sd-line)", paddingTop: 16 }}>
            <div className="flex justify-between"><span>小計</span><span className="mono">¥{order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>配送料</span><span className="mono">¥{order.shipping.toLocaleString()}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between" style={{ color: "var(--sd-ink-3)" }}>
                <span>割引</span><span className="mono">— ¥{order.discount.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-baseline mt-3.5" style={{ borderTop: "var(--sd-line-strong)", paddingTop: 14 }}>
            <span style={{ fontFamily: "var(--font-serif-jp)", fontSize: 15 }}>合計</span>
            <span className="mono" style={{ fontSize: 22 }}>¥{order.total.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <div className="grid gap-4 text-sm" style={{ borderTop: "var(--sd-line-strong)", paddingTop: 22, gridTemplateColumns: "auto 1fr", rowGap: 14, columnGap: 24 }}>
            <span className="en-caps" style={{ fontSize: 9 }}>Status</span>
            <span>{order.status}</span>
            <span className="en-caps" style={{ fontSize: 9 }}>Placed</span>
            <span>{new Date(order.created_at).toLocaleString("ja-JP")}</span>
            <span className="en-caps" style={{ fontSize: 9 }}>Ship To</span>
            <span>{order.shipping_address}</span>
            <span className="en-caps" style={{ fontSize: 9 }}>Payment</span>
            <span className="mono">{order.payment_method}</span>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import StoreLayout from "@/components/StoreLayout";

function CompleteContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get("order") || "SD-2026-0000-00000";

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <StoreLayout>
      {/* Progress */}
      <div className="flex gap-8 text-xs" style={{ padding: "28px 44px", borderBottom: "var(--sd-line)" }}>
        {[
          { n: "01", jp: "カート", en: "Cart" },
          { n: "02", jp: "ご注文内容", en: "Review" },
          { n: "03", jp: "お支払い", en: "Payment" },
          { n: "04", jp: "完了", en: "Complete" },
        ].map((s, i) => (
          <div
            key={s.n}
            className="flex items-center gap-2.5"
            style={{ color: i === 3 ? "var(--sd-forest)" : "var(--sd-ink-4)" }}
          >
            <span className="mono">{s.n}</span>
            <span>
              <span style={{ fontFamily: "var(--font-serif-jp)" }}>{s.jp}</span>
              <span className="en ml-1.5" style={{ fontSize: 9 }}>{s.en}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: "56px 44px" }}>
        <div className="en-caps">Order Complete · Thank you</div>
        <h1 style={{ fontSize: 56, marginTop: 10, lineHeight: 1.2 }}>
          ご注文、<br />ありがとうございました。
        </h1>
        <p className="mt-5 text-base leading-8" style={{ color: "var(--sd-ink-2)", maxWidth: 480 }}>
          ひとつひとつ、工房から直接お送りいたします。
          ご注文の確認メールをお送りしました。発送のご連絡まで、もう少しだけお待ちください。
        </p>

        <div
          className="grid mt-9 text-sm"
          style={{
            borderTop: "var(--sd-line-strong)",
            paddingTop: 22,
            gridTemplateColumns: "auto 1fr",
            rowGap: 16,
            columnGap: 32,
          }}
        >
          <span className="en-caps" style={{ fontSize: 9 }}>Order No.</span>
          <span className="mono">{orderNo}</span>
          <span className="en-caps" style={{ fontSize: 9 }}>Placed</span>
          <span>{dateStr}</span>
        </div>

        <div className="flex gap-3.5 mt-9">
          <Link href="/orders" className="sd-btn sd-btn--primary no-underline">
            注文履歴を見る <span className="arr">→</span>
          </Link>
          <Link href="/products" className="sd-btn sd-btn--ghost no-underline">
            買い物を続ける
          </Link>
        </div>

        <p className="mt-10" style={{ fontFamily: "var(--font-serif-en)", fontStyle: "italic", fontSize: 14, color: "var(--sd-ink-3)" }}>
          &quot;One season, one object, one table at a time.&quot;
        </p>
      </div>
    </StoreLayout>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense fallback={<div />}>
      <CompleteContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { items, totalCount } = useCart();
  const { user, signOut } = useAuth();

  // BUG: #3 — 商品を削除後、件数バッジが更新されない
  // CartContext側で headerCount を別管理し、削除時に更新しない
  const displayCount = totalCount;

  const navItems = [
    { id: "shop", jp: "ショップ", en: "Shop", href: "/products", disabled: false },
    { id: "journal", jp: "読みもの", en: "Journal", href: "#", disabled: true },
    { id: "about", jp: "わたしたちについて", en: "About", href: "#", disabled: true },
    { id: "stores", jp: "店舗", en: "Stores", href: "#", disabled: true },
  ];

  const isActive = (href: string) => pathname.startsWith(href) && href !== "#";

  return (
    <header
      className="flex items-center justify-between bg-sd-cream"
      style={{ padding: "22px 44px", borderBottom: "var(--sd-line)" }}
    >
      <Link href="/products"><Logo /></Link>
      <nav className="flex gap-9">
        {navItems.map((it) => (
          it.disabled ? (
            <span
              key={it.id}
              className="text-center"
              style={{
                lineHeight: 1.1,
                color: "var(--sd-ink-4)",
                opacity: 0.5,
                cursor: "not-allowed",
                paddingBottom: 4,
              }}
            >
              <div style={{ fontFamily: "var(--font-sans-jp)", fontSize: 13, fontWeight: 500 }}>{it.jp}</div>
              <div className="en-caps" style={{ marginTop: 2, fontSize: 8 }}>{it.en}</div>
            </span>
          ) : (
            <Link
              key={it.id}
              href={it.href}
              className="no-underline text-center"
              style={{
                lineHeight: 1.1,
                color: isActive(it.href) ? "var(--sd-forest)" : "var(--sd-ink-2)",
                borderBottom: isActive(it.href) ? "1px solid var(--sd-forest)" : "1px solid transparent",
                paddingBottom: 4,
              }}
            >
              <div style={{ fontFamily: "var(--font-sans-jp)", fontSize: 13, fontWeight: 500 }}>{it.jp}</div>
              <div className="en-caps" style={{ marginTop: 2, fontSize: 8 }}>{it.en}</div>
            </Link>
          )
        ))}
      </nav>
      <div className="flex items-center gap-6 text-xs">
        {user ? (
          <>
            <Link href="/mypage" className="en-caps no-underline">Account</Link>
            {user.role === "admin" && <Link href="/admin/products" className="en-caps no-underline">Admin</Link>}
            <button onClick={async () => { await signOut(); router.push("/login"); }} className="en-caps cursor-pointer bg-transparent border-none">Sign Out</button>
          </>
        ) : (
          <Link href="/login" className="en-caps no-underline">Sign In</Link>
        )}
        <Link href="/cart" className="inline-flex items-baseline gap-1.5 no-underline">
          <span className="en-caps">Cart</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--sd-ink)" }}>
            ({String(displayCount).padStart(2, "0")})
          </span>
        </Link>
      </div>
    </header>
  );
}

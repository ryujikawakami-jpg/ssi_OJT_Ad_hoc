"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { id: "dashboard", jp: "ダッシュボード", en: "Dashboard", href: "/admin" },
  { id: "products", jp: "商品管理", en: "Products", href: "/admin/products" },
  { id: "orders", jp: "注文管理", en: "Orders", href: "/admin/orders" },
  { id: "customers", jp: "顧客管理", en: "Customers", href: "#" },
  { id: "reports", jp: "売上レポート", en: "Reports", href: "/admin/reports" },
  { id: "settings", jp: "設定", en: "Settings", href: "#" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className="flex flex-col bg-sd-paper"
      style={{ width: 232, borderRight: "var(--sd-line)", padding: "24px 0" }}
    >
      <div style={{ padding: "0 24px 24px" }}>
        <Logo size={16} />
        <div className="en-caps" style={{ marginTop: 10, fontSize: 9 }}>Atelier · Admin</div>
      </div>
      <div style={{ borderTop: "var(--sd-line)" }} />
      <nav className="grid gap-0.5" style={{ padding: "16px 12px" }}>
        {items.map((it) => {
          const on = pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href) && it.href !== "#");
          return (
            <Link
              key={it.id}
              href={it.href}
              className="block no-underline"
              style={{
                padding: "10px 14px",
                borderRadius: 2,
                background: on ? "var(--sd-forest)" : "transparent",
                color: on ? "var(--sd-paper)" : "var(--sd-ink-2)",
              }}
            >
              <div style={{ fontSize: 13, fontFamily: "var(--font-sans-jp)" }}>{it.jp}</div>
              <div
                className="en-caps"
                style={{ fontSize: 8, marginTop: 2, color: on ? "rgba(251,248,241,0.6)" : "var(--sd-ink-4)" }}
              >
                {it.en}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto" style={{ padding: "16px 24px", borderTop: "var(--sd-line)" }}>
        <div style={{ fontSize: 12 }}>管理者</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--sd-ink-3)" }}>
          {user?.email || "admin@shopdemo.com"}
        </div>
      </div>
    </aside>
  );
}

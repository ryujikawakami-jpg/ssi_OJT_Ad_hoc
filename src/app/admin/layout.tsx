"use client";

// BUG: #14 — 一般ユーザーが /admin を直打ちで閲覧できる（操作は不可）
// ロール判定をしていない。ページは表示される
import AdminSidebar from "@/components/AdminSidebar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex bg-sd-cream">
      <AdminSidebar />
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}

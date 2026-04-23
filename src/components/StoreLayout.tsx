"use client";

import TopNav from "./TopNav";
import Footer from "./Footer";
import { ReactNode } from "react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}

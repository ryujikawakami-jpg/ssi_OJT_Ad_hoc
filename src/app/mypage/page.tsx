"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StoreLayout from "@/components/StoreLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/lib/types";

type Tab = "profile" | "orders" | "favorites" | "addresses" | "password" | "signout";

export default function MyPagePage() {
  const { user, updateProfile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [form, setForm] = useState({
    name_jp: "",
    name_kana: "",
    email: "",
    phone: "",
    birth_date: "",
    postal_code: "",
    address: "",
  });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      setForm({
        name_jp: user.name_jp || "",
        name_kana: user.name_kana || "",
        email: user.email || "",
        phone: user.phone || "",
        birth_date: user.birth_date || "",
        postal_code: user.postal_code || "",
        address: user.address || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)
        .then(({ data }) => {
          if (data) setRecentOrders(data as Order[]);
        });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    await updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePassword = async () => {
    // BUG: #9 — パスワード変更で「新しいパスワード」と「確認用」が一致しなくても保存できる
    // newPw === confirm の検証が抜けている
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (!error) {
      setSaved(true);
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const tabs: { id: Tab; jp: string; en: string; disabled?: boolean }[] = [
    { id: "profile", jp: "プロフィール", en: "Profile" },
    { id: "orders", jp: "注文履歴", en: "Orders" },
    { id: "favorites", jp: "お気に入り", en: "Favorites", disabled: true },
    { id: "addresses", jp: "配送先", en: "Addresses", disabled: true },
    { id: "password", jp: "パスワード変更", en: "Password" },
    { id: "signout", jp: "ログアウト", en: "Sign Out" },
  ];

  return (
    <StoreLayout>
      <div className="flex justify-between items-end" style={{ padding: "44px 44px 20px", borderBottom: "var(--sd-line)" }}>
        <div>
          <div className="en-caps">Your Account</div>
          <h1 style={{ fontSize: 44, marginTop: 4 }}>マイページ</h1>
        </div>
        <div className="text-right text-xs" style={{ color: "var(--sd-ink-3)" }}>
          <div className="mono">Member since {user?.created_at ? new Date(user.created_at).getFullYear() : "2023"}</div>
          <div className="mt-0.5">{user?.name_jp || ""} 様</div>
        </div>
      </div>

      <div className="grid flex-1" style={{ gridTemplateColumns: "220px 1fr", minHeight: 0 }}>
        {/* Side nav */}
        <aside className="text-sm" style={{ padding: "28px 0 28px 44px", borderRight: "var(--sd-line)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.disabled) return;
                if (t.id === "signout") { signOut(); return; }
                setTab(t.id);
              }}
              className="block w-full text-left bg-transparent border-none"
              style={{
                padding: "11px 16px 11px 0",
                borderBottom: "var(--sd-line)",
                color: t.disabled ? "var(--sd-ink-4)" : tab === t.id ? "var(--sd-forest)" : "var(--sd-ink-2)",
                cursor: t.disabled ? "not-allowed" : "pointer",
                opacity: t.disabled ? 0.5 : 1,
              }}
            >
              <div style={{ fontFamily: "var(--font-serif-jp)" }}>
                {!t.disabled && tab === t.id && "· "}{t.jp}
                {t.disabled && <span style={{ fontSize: 9, marginLeft: 6, color: "var(--sd-ink-4)" }}>未実装</span>}
              </div>
              <div className="en-caps" style={{ fontSize: 8, marginTop: 2 }}>{t.en}</div>
            </button>
          ))}
        </aside>

        {/* Content */}
        <div style={{ padding: "36px 56px", overflow: "auto" }}>
          {tab === "profile" && (
            <>
              <div className="flex items-baseline justify-between">
                <h2 style={{ fontSize: 24 }}>プロフィール</h2>
                <span className="en-caps">Profile Information</span>
              </div>

              <div className="grid gap-7 mt-7" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: 760 }}>
                <FormField label="お名前" en="Full Name" value={form.name_jp} onChange={(v) => setForm({ ...form, name_jp: v })} />
                <FormField label="お名前（かな）" en="Reading" value={form.name_kana} onChange={(v) => setForm({ ...form, name_kana: v })} />
                <FormField label="メールアドレス" en="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                {/* BUG: #7 — 電話番号フィールドにアルファベットが入力できる */}
                <div>
                  <label className="sd-field-label">電話番号 · Phone</label>
                  <input
                    className="sd-input"
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <FormField label="生年月日" en="Birth Date" value={form.birth_date} onChange={(v) => setForm({ ...form, birth_date: v })} />
                <FormField label="郵便番号" en="Postal Code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} />
                <div style={{ gridColumn: "span 2" }}>
                  <FormField label="ご住所" en="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                </div>
              </div>

              <div className="flex justify-between items-center mt-8" style={{ borderTop: "var(--sd-line)", paddingTop: 20 }}>
                <div className="text-xs" style={{ color: "var(--sd-ink-3)" }}>
                  {saved && "変更を保存しました ✓"}
                </div>
                <div className="flex gap-2.5">
                  <button className="sd-btn sd-btn--quiet">キャンセル</button>
                  <button className="sd-btn sd-btn--primary" onClick={handleSaveProfile}>
                    変更を保存 <span className="arr">→</span>
                  </button>
                </div>
              </div>

              {/* Recent orders */}
              <div className="mt-11" style={{ borderTop: "var(--sd-line)", paddingTop: 22 }}>
                <div className="en-caps">Recent Orders</div>
                <h3 style={{ fontSize: 18, marginTop: 4 }}>最近のご注文</h3>
                <table className="w-full mt-4 text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--sd-ink-3)" }}>
                      {["注文番号", "日付", "商品", "金額", "状態"].map((h) => (
                        <th key={h} style={{ padding: "10px 0", borderBottom: "var(--sd-line-strong)", fontWeight: 500, fontFamily: "var(--font-serif-jp)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id} style={{ borderBottom: "var(--sd-line)" }}>
                        <td className="mono" style={{ padding: "14px 0", fontSize: 11 }}>{o.order_no}</td>
                        <td className="mono" style={{ padding: "14px 0" }}>
                          {new Date(o.created_at).toLocaleDateString("ja-JP").replace(/\//g, ".")}
                        </td>
                        <td style={{ padding: "14px 0", fontFamily: "var(--font-serif-jp)" }}>
                          {o.items[0]?.name_jp}{o.items.length > 1 ? ` ほか ${o.items.length - 1} 品` : ""}
                        </td>
                        <td className="mono" style={{ padding: "14px 0" }}>¥{o.total.toLocaleString()}</td>
                        <td style={{ padding: "14px 0" }}>{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "password" && (
            <>
              <h2 style={{ fontSize: 24 }}>パスワード変更</h2>
              <div className="grid gap-6 mt-7" style={{ maxWidth: 400 }}>
                <div>
                  <label className="sd-field-label">現在のパスワード · Current</label>
                  <input className="sd-input" type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
                </div>
                <div>
                  <label className="sd-field-label">新しいパスワード · New</label>
                  <input className="sd-input" type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} />
                </div>
                <div>
                  <label className="sd-field-label">新しいパスワード（確認） · Confirm</label>
                  <input className="sd-input" type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
                </div>
                {/* BUG: #9 — newPw !== confirm でも保存ボタンが有効 */}
                <button className="sd-btn sd-btn--primary" onClick={handleSavePassword}>
                  パスワードを変更 <span className="arr">→</span>
                </button>
                {saved && <div className="text-xs" style={{ color: "var(--sd-moss)" }}>パスワードを変更しました ✓</div>}
              </div>
            </>
          )}

          {tab === "orders" && (
            <>
              <h2 style={{ fontSize: 24 }}>注文履歴</h2>
              <p className="mt-3 text-sm" style={{ color: "var(--sd-ink-2)" }}>
                <Link href="/orders" className="no-underline" style={{ color: "var(--sd-forest)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  注文履歴ページを見る →
                </Link>
              </p>
            </>
          )}

          {(tab === "favorites" || tab === "addresses") && (
            <div className="text-center py-16">
              <h3 style={{ fontFamily: "var(--font-serif-jp)", fontSize: 22 }}>準備中です。</h3>
              <div className="en mt-1.5" style={{ fontSize: 10 }}>Coming soon.</div>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}

function FormField({ label, en, value, onChange }: { label: string; en: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="sd-field-label">{label} · {en}</label>
      <input className="sd-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

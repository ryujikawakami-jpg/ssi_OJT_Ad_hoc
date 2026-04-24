"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        setLoading(false);
      } else {
        router.push("/products");
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("ログイン中にエラーが発生しました。");
      setLoading(false);
    }
  };

  // BUG: #5 — パスワードが空欄でもログインボタンが活性化している
  // disabled条件にpasswordを含めていない
  const isDisabled = !email;

  return (
    <div className="h-screen grid grid-cols-2">
      {/* Left panel */}
      <div
        className="relative flex flex-col justify-between"
        style={{ background: "var(--sd-forest)", color: "var(--sd-paper)", padding: 56 }}
      >
        <Logo mono size={20} />
        <div>
          <div className="en" style={{ color: "rgba(251,248,241,0.55)", fontSize: 11 }}>
            Spring Edition · No. 04
          </div>
          <h1 style={{ fontFamily: "var(--font-serif-jp)", fontSize: 54, lineHeight: 1.15, marginTop: 18, letterSpacing: "0.04em" }}>
            静けさを、<br />手のひらに。
          </h1>
          <p style={{ marginTop: 18, maxWidth: 360, color: "rgba(251,248,241,0.78)", lineHeight: 1.9, fontSize: 14 }}>
            季節のうつろいとともに。四月の新入荷は、益子の土もの、倉敷のリネン、秋田の木匙より。
          </p>
          <p style={{ marginTop: 12, fontStyle: "italic", fontFamily: "var(--font-serif-en)", fontSize: 13, color: "rgba(251,248,241,0.55)" }}>
            &quot;A season of earthenware, linen, and wood.&quot;
          </p>
        </div>
        <div className="flex justify-between items-baseline" style={{ fontSize: 11, color: "rgba(251,248,241,0.55)" }}>
          <span className="mono">EST. 二〇一八</span>
          <span className="en-caps" style={{ fontSize: 9 }}>Kyoto · Tokyo · Online</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col justify-center bg-sd-cream" style={{ padding: "80px 72px" }}>
        <div className="en-caps">Sign in</div>
        <h2 style={{ fontSize: 32, marginTop: 6 }}>ようこそ、おかえりなさい</h2>
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--sd-ink-3)" }}>
          ご注文・配送先・お気に入りを、いつもの場所で。
        </p>

        <form onSubmit={handleSubmit} className="grid gap-6 mt-10" style={{ maxWidth: 380 }}>
          <div>
            <label className="sd-field-label">メールアドレス · Email</label>
            <input
              className="sd-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="sd-field-label">パスワード · Password</label>
            <input
              className="sd-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "var(--sd-wine)" }}>{error}</div>
          )}

          <div className="flex justify-between items-center text-xs">
            <label className="inline-flex items-center gap-2" style={{ color: "var(--sd-ink-2)" }}>
              <input type="checkbox" defaultChecked className="w-3.5 h-3.5" />
              ログイン状態を保持する
            </label>
            <span style={{ color: "var(--sd-ink-4)", opacity: 0.5, cursor: "not-allowed" }}>
              パスワードをお忘れですか？
            </span>
          </div>

          {/* BUG: #5 — disabled={!email} のみ。password を判定していない */}
          <button
            type="submit"
            className="sd-btn sd-btn--primary w-full"
            style={{ marginTop: 8, padding: "16px" }}
            disabled={isDisabled || loading}
          >
            {loading ? "ログイン中..." : "ログイン"} <span className="arr">→</span>
          </button>

          <div className="text-center text-xs" style={{ color: "var(--sd-ink-4)", marginTop: 8, opacity: 0.5 }}>
            はじめての方は{" "}
            <span style={{ cursor: "not-allowed" }}>新規会員登録</span>
          </div>
        </form>

        <div className="mt-auto pt-16 flex justify-between" style={{ fontSize: 10, color: "var(--sd-ink-4)" }}>
          <span className="mono">© 2026 ShopDemo Co., Ltd.</span>
          <span style={{ opacity: 0.5 }} className="en-caps">Privacy · Terms · Cookies</span>
        </div>
      </div>
    </div>
  );
}

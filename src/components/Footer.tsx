"use client";

import Logo from "./Logo";

export default function Footer() {
  const columns = [
    { h: "ショップ", en: "Shop", items: ["新入荷", "陶器", "キッチン", "テキスタイル", "家具"] },
    { h: "案内", en: "Guide", items: ["配送について", "返品・交換", "お手入れ", "FAQ"] },
    { h: "わたしたち", en: "Company", items: ["哲学", "産地を訪ねる", "掲載メディア", "お問い合わせ"] },
  ];

  return (
    <footer
      className="bg-sd-cream text-sd-ink-3"
      style={{ borderTop: "var(--sd-line)", padding: "36px 44px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, fontSize: 12 }}
    >
      <div>
        <Logo size={18} />
        <p className="mt-3.5 leading-[1.8]" style={{ maxWidth: 260 }}>暮らしに静けさをもたらす、ひとつひとつの道具を。</p>
        <p className="en mt-2" style={{ fontSize: 9 }}>Quiet tools for a considered life.</p>
      </div>
      {columns.map((col) => (
        <div key={col.h}>
          <div style={{ fontFamily: "var(--font-serif-jp)", fontSize: 13, color: "var(--sd-ink)", marginBottom: 4 }}>{col.h}</div>
          <div className="en-caps" style={{ fontSize: 9, marginBottom: 14 }}>{col.en}</div>
          <ul className="list-none p-0 m-0 grid gap-2">
            {col.items.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </div>
      ))}
    </footer>
  );
}

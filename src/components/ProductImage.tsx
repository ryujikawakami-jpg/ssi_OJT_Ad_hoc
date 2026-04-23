"use client";

interface Props {
  label: string;
  subLabel?: string;
  tonal?: string;
  height?: number;
  children?: React.ReactNode;
}

export default function ProductImage({ label, subLabel, tonal = "a", height = 360, children }: Props) {
  return (
    <div className={`sd-placeholder tonal-${tonal}`} style={{ height, width: "100%" }}>
      <div className="flex justify-between w-full items-end">
        <div>
          <div className="tag">{label}</div>
          {subLabel && <div className="tag mt-0.5">{subLabel}</div>}
        </div>
        <div className="flex flex-col items-end">
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function isValidHex(v: string) {
  return /^#[0-9a-fA-F]{3,8}$/.test(v.trim());
}

export function ColorInputField({ label, onChange, value }: Props) {
  const safeHex = isValidHex(value) ? value : "#000000";

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-bold text-slate-200">{label}</label>
      <div className="flex items-center gap-2">
        {/* Native renk seçici */}
        <input
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-cyan-300/25 bg-slate-950/80 p-1"
          onChange={(e) => onChange(e.target.value)}
          title={`${label} renk seçici`}
          type="color"
          value={safeHex}
        />
        {/* Hex metin kutusu — senkron */}
        <input
          className="min-h-10 flex-1 rounded-md border border-cyan-300/20 bg-slate-950/80 px-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          spellCheck={false}
          type="text"
          value={value}
        />
        {/* Canlı önizleme */}
        {isValidHex(value) && (
          <span
            className="h-8 w-8 shrink-0 rounded border border-white/15"
            style={{ backgroundColor: value }}
            title={value}
          />
        )}
      </div>
    </div>
  );
}

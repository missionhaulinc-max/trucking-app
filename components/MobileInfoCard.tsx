"use client";

type Field = {
  label: string;
  value: string;
};

type Action = {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
};

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  fields: Field[];
  actions?: Action[];
};

export default function MobileInfoCard({
  title,
  subtitle,
  badge,
  badgeColor = "bg-slate-100 text-slate-700",
  fields,
  actions = [],
}: Props) {
  return (
    <div className="sm:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>

        {badge && (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {fields.map((f, i) => (
          <div key={i}>
            <p className="text-[10px] uppercase text-slate-400">{f.label}</p>
            <p className="text-sm font-semibold text-slate-800">{f.value}</p>
          </div>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="flex gap-2 pt-2">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                a.variant === "danger"
                  ? "bg-red-600 text-white"
                  : "bg-slate-900 text-white"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
interface StatCardProps {
  label: string;
  value: string | number;
  note?: string;
}

export function StatCard({ label, value, note }: StatCardProps): React.JSX.Element {
  return (
    <article className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-brand-800">{value}</p>
      {note && <p className="mt-1 text-sm text-slate-500">{note}</p>}
    </article>
  );
}


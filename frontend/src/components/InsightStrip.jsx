export default function InsightStrip({ items }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-[24px] border border-ink/10 bg-[#fffaf0]/90 p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
            {item.label}
          </p>
          <p className="mt-3 break-words text-3xl font-bold text-ink">{item.value}</p>
          <p className="mt-2 text-sm leading-6 text-steel">{item.description}</p>
        </article>
      ))}
    </section>
  );
}

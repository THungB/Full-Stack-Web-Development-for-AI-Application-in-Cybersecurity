export default function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-xs font-medium text-steel">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base leading-7 text-steel">{description}</p>
        ) : null}
      </div>
      {action ? <div className="w-full md:w-auto">{action}</div> : null}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  endpoint?: string;
  description?: string;
}

export function PageHeader({ title, endpoint, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        {endpoint && (
          <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-500">
            {endpoint}
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-zinc-500">{description}</p>
      )}
    </div>
  );
}

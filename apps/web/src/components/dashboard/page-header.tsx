interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>
      </div>
      {description && (
        <p className="text-sm text-zinc-500">{description}</p>
      )}
    </div>
  );
}

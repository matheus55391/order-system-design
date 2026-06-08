import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function AuthField({ id, label, error, children }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function authInputClass(className?: string) {
  return cn(
    "h-11 border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600",
    "focus-visible:border-orange-500 focus-visible:ring-orange-500/50",
    className,
  );
}

export function AuthInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={authInputClass(className)} {...props} />;
}

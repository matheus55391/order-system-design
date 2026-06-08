import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
}

export function AuthButton({
  children,
  loading,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className={cn("h-11 w-full", className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          {children}
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  );
}

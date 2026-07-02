import { cn } from "../../lib/cn";

export function ArcadeButton({ as: Component = "button", variant = "secondary", className, ...props }) {
  return (
    <Component
      className={cn("crt-button", variant === "primary" && "crt-button-primary", className)}
      {...props}
    />
  );
}

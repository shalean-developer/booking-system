import * as React from "react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginButtonProps {
  className?: string;
  onClick?: () => void;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showAvatar?: boolean;
  avatarSrc?: string;
  avatarAlt?: string;
  children?: React.ReactNode;
}

const LoginButton = React.forwardRef<HTMLButtonElement, LoginButtonProps>(
  ({ 
    className, 
    onClick, 
    size = "default", 
    variant = "default",
    showAvatar = true,
    avatarSrc,
    avatarAlt = "User avatar",
    children = "Login",
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground",
          className
        )}
        size={size}
        variant={variant}
        onClick={onClick}
        {...props}
      >
        {showAvatar && (
          <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={avatarAlt}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <User className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        )}
        {children}
      </Button>
    );
  }
);

LoginButton.displayName = "LoginButton";

export { LoginButton };

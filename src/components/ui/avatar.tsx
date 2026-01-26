"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { User } from "lucide-react";

/**
 * Avatar size variants
 */
type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/**
 * Size mappings for avatar dimensions
 */
const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
  "2xl": "h-24 w-24",
};

/**
 * Font size mappings for avatar fallback text
 */
const fontSizeClasses: Record<AvatarSize, string> = {
  xs: "text-xs",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
  "2xl": "text-2xl",
};

/**
 * Icon size mappings for avatar fallback icon
 */
const iconSizeClasses: Record<AvatarSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  "2xl": "h-12 w-12",
};

/**
 * Props for the Avatar component
 */
export interface AvatarProps {
  /** URL of the avatar image */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Fallback text (usually initials or first letter of username) */
  fallback?: string;
  /** Size of the avatar */
  size?: AvatarSize;
  /** Show border around avatar */
  bordered?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Avatar component for displaying user profile pictures with fallback support
 *
 * @example
 * // With image
 * <Avatar
 *   src="/path/to/image.jpg"
 *   alt="Username"
 *   fallback="U"
 *   size="md"
 * />
 *
 * @example
 * // Without image (fallback)
 * <Avatar
 *   fallback="JD"
 *   size="lg"
 *   bordered
 * />
 */
export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  bordered = false,
  className,
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-sub-alt transition-all duration-125",
        sizeClasses[size],
        bordered && "ring-2 ring-sub",
        onClick && "cursor-pointer hover:ring-main",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {showFallback ? (
        <AvatarFallback fallback={fallback} size={size} />
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

/**
 * Props for the AvatarFallback component
 */
interface AvatarFallbackProps {
  fallback?: string;
  size: AvatarSize;
}

/**
 * Fallback content when no image is available
 */
function AvatarFallback({ fallback, size }: AvatarFallbackProps) {
  if (fallback) {
    return (
      <span
        className={cn(
          "font-medium text-sub select-none",
          fontSizeClasses[size]
        )}
      >
        {fallback.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return <User className={cn("text-sub", iconSizeClasses[size])} />;
}

/**
 * Props for the AvatarGroup component
 */
export interface AvatarGroupProps {
  /** Array of avatar props */
  avatars: AvatarProps[];
  /** Maximum number of avatars to show before showing count */
  max?: number;
  /** Size of avatars */
  size?: AvatarSize;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AvatarGroup displays a stack of overlapping avatars
 *
 * @example
 * <AvatarGroup
 *   avatars={[
 *     { src: "/avatar1.jpg", alt: "User 1" },
 *     { src: "/avatar2.jpg", alt: "User 2" },
 *     { fallback: "U3" },
 *   ]}
 *   max={3}
 * />
 */
export function AvatarGroup({
  avatars,
  max = 5,
  size = "md",
  className,
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          {...avatar}
          size={size}
          bordered
          className="ring-bg"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "relative inline-flex items-center justify-center rounded-full bg-sub-alt ring-2 ring-bg",
            sizeClasses[size]
          )}
        >
          <span className={cn("font-medium text-sub", fontSizeClasses[size])}>
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}

export default Avatar;

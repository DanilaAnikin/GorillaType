import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names with Tailwind CSS classes.
 * Uses clsx for conditional class names and tailwind-merge to handle
 * Tailwind CSS class conflicts intelligently.
 *
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 * @returns Merged class name string
 *
 * @example
 * cn("px-4 py-2", "bg-blue-500", { "opacity-50": isDisabled })
 * cn("text-red-500", "text-blue-500") // Returns "text-blue-500" (last wins)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

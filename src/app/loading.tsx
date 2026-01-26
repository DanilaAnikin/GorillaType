/**
 * Loading component - Displayed during page transitions and data fetching.
 * Shows a simple, themed loading spinner.
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-sub-alt rounded-full" />
          <div className="absolute inset-0 border-4 border-main border-t-transparent rounded-full animate-spin" />
        </div>

        {/* Loading Text */}
        <p className="text-sub text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

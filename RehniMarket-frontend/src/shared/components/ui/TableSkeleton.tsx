import Skeleton from "./Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: string[];
  className?: string;
}

export default function TableSkeleton({
  rows = 5,
  columns = ["30%", "22%", "18%", "16%", "10%"],
  className,
}: TableSkeletonProps) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 border-b border-gray-100 px-2 py-4 last:border-0"
        >
          {columns.map((width, colIndex) => (
            <Skeleton key={colIndex} className="h-4" style={{ width }} />
          ))}
        </div>
      ))}
    </div>
  );
}

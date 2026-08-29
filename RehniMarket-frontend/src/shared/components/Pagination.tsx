import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildPageList } from "@/shared/utils/buildPageList";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Paginación reutilizable: anterior/siguiente + números + "…". No se renderiza con una sola página.
export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageList = buildPageList(page, totalPages);

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>

      {pageList.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            aria-label={`Página ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition ${
              item === page
                ? "bg-[#6D0F2D] text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Página siguiente"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

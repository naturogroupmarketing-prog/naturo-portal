"use client";

import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Build the list of page numbers to display, collapsing middle ranges with ellipsis.
 * Always shows first, last, and up to 2 pages around the current page.
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const siblings = 1; // pages to show on each side of the current page

  const leftSibling = Math.max(currentPage - siblings, 2);
  const rightSibling = Math.min(currentPage + siblings, totalPages - 1);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  // Always include page 1
  pages.push(1);

  if (showLeftEllipsis) {
    pages.push("ellipsis");
  } else {
    // Fill in pages between 1 and leftSibling
    for (let i = 2; i < leftSibling; i++) {
      pages.push(i);
    }
  }

  // Sibling range (includes current page)
  for (let i = leftSibling; i <= rightSibling; i++) {
    pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push("ellipsis");
  } else {
    // Fill in pages between rightSibling and last
    for (let i = rightSibling + 1; i < totalPages; i++) {
      pages.push(i);
    }
  }

  // Always include last page
  pages.push(totalPages);

  return pages;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 sm:gap-1.5"
    >
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
        className={cn(
          "inline-flex items-center justify-center rounded-[28px] font-medium transition-all duration-200",
          "min-h-[44px] min-w-[44px] px-3 text-sm",
          "border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800",
          "text-shark-700 dark:text-shark-300",
          "hover:bg-shark-50 dark:hover:bg-shark-700",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-action-400/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-shark-900",
          "disabled:opacity-50 disabled:pointer-events-none",
          "cursor-pointer active:scale-[0.97]"
        )}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1"
        >
          <path d="M19 12H5 M12 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page numbers */}
      {pageNumbers.map((pageNum, idx) =>
        pageNum === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[36px] text-sm text-shark-400 dark:text-shark-500 dark:text-shark-400 select-none"
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            disabled={pageNum === currentPage}
            aria-label={`Go to page ${pageNum}`}
            aria-current={pageNum === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex items-center justify-center rounded-[28px] font-medium transition-all duration-200",
              "min-h-[44px] min-w-[44px] text-sm",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-action-400/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-shark-900",
              "cursor-pointer active:scale-[0.97]",
              pageNum === currentPage
                ? "bg-action-400 text-white shadow-sm pointer-events-none"
                : "border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 text-shark-700 dark:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-700"
            )}
          >
            {pageNum}
          </button>
        )
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
        className={cn(
          "inline-flex items-center justify-center rounded-[28px] font-medium transition-all duration-200",
          "min-h-[44px] min-w-[44px] px-3 text-sm",
          "border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800",
          "text-shark-700 dark:text-shark-300",
          "hover:bg-shark-50 dark:hover:bg-shark-700",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-action-400/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-shark-900",
          "disabled:opacity-50 disabled:pointer-events-none",
          "cursor-pointer active:scale-[0.97]"
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1"
        >
          <path d="M5 12h14 M12 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

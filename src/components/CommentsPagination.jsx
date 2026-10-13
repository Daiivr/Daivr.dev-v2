import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { commentPageNumbers } from "../lib/commentPagination";

export function CommentsPagination({ currentPage, totalPages, totalComments, pageSize, pinnedCount = 0, onPageChange }) {
  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, totalComments);
  return (
    <nav className="comments-pagination" aria-label="Comment pages">
      <span className="comments-pagination-label"><MessageSquare size={11} aria-hidden="true" /> Message log</span>
      <div className="comments-pagination-summary" role="status">
        <div>
          <p><strong>{first === last ? first : `${first}–${last}`}</strong> of {totalComments} comments{pinnedCount > 0 ? <span className="comments-pagination-pinned"> · {pinnedCount} pinned</span> : null}</p>
        </div>
      </div>
      <div className="comments-pagination-controls">
        <button className="comments-page-arrow" type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous comments page"><ChevronLeft size={17} aria-hidden="true" /><span>Prev</span></button>
        <div className="comments-page-numbers">
          {commentPageNumbers(currentPage, totalPages).map((page) => typeof page === "number"
            ? <button type="button" key={page} aria-label={`Comment page ${page}`} aria-current={page === currentPage ? "page" : undefined} onClick={() => onPageChange(page)}>{String(page).padStart(2, "0")}</button>
            : <span className="comments-page-gap" key={page} aria-hidden="true">…</span>)}
        </div>
        <button className="comments-page-arrow" type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next comments page"><span>Next</span><ChevronRight size={17} aria-hidden="true" /></button>
      </div>
    </nav>
  );
}

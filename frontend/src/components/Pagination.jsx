function Pagination({ currentPage, totalPages, onPageChange, label }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);
    if (currentPage <= 4) { start = 2; end = Math.min(5, totalPages - 1); }
    if (currentPage >= totalPages - 3) { start = Math.max(totalPages - 4, 2); end = totalPages - 1; }
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="pagination">
      <div className="pagination-info">
        Mostrando página {currentPage} de {totalPages}
      </div>
      <div className="pagination-controls">
        <button
          className="page-btn-nav"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >‹</button>
        <span className="page-numbers-desktop">
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={currentPage === p ? "active" : ""}
              >{p}</button>
            )
          )}
        </span>
        <button
          className="page-btn-nav"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >›</button>
      </div>
    </div>
  );
}

export default Pagination;

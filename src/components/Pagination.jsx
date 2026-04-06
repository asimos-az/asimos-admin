import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 12 }}>
      <button 
        className="iconBtn" 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{ opacity: currentPage === 1 ? 0.5 : 1, width: 36, height: 36 }}
      >
        <ChevronLeft size={18} />
      </button>
      
      <div className="muted" style={{ fontWeight: 600, fontSize: 13 }}>
        Səhifə {currentPage} / {totalPages}
      </div>
      
      <button 
        className="iconBtn" 
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{ opacity: currentPage >= totalPages ? 0.5 : 1, width: 36, height: 36 }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

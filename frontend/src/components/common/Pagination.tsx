// frontend\src\components\common\Pagination.tsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    indexOfFirstItem: number;
    indexOfLastItem: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    indexOfFirstItem,
    indexOfLastItem
}) => {
    if (totalPages <= 1) return null;

    return (
        <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
                borderTop: "1px solid #d0dff0",
                backgroundColor: "#e8f0f7",
            }}
        >
            <div className="text-sm" style={{ color: "#555555" }}>
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, totalItems)} of {totalItems} items
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #d0dff0",
                        color: "#1a3c6e",
                    }}
                    onMouseEnter={(e) => {
                        if (currentPage !== 1)
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d0dff0";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
                    }}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        style={
                            currentPage === page
                                ? {
                                    backgroundColor: "#1a3c6e",
                                    color: "#ffffff",
                                    border: "1px solid #1a3c6e",
                                }
                                : {
                                    backgroundColor: "#ffffff",
                                    color: "#555555",
                                    border: "1px solid #d0dff0",
                                }
                        }
                        onMouseEnter={(e) => {
                            if (currentPage !== page)
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d0dff0";
                        }}
                        onMouseLeave={(e) => {
                            if (currentPage !== page)
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
                        }}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #d0dff0",
                        color: "#1a3c6e",
                    }}
                    onMouseEnter={(e) => {
                        if (currentPage !== totalPages)
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d0dff0";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
                    }}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
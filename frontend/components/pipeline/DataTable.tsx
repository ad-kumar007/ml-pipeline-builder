"use client";

import React from "react";
import { DataPreview } from "@/lib/api";

interface DataTableProps {
  preview: DataPreview;
  maxRows?: number;
}

export default function DataTable({ preview, maxRows = 10 }: DataTableProps) {
  const displayData = preview.data.slice(0, maxRows);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                #
              </th>
              {preview.columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap"
                >
                  <div className="flex flex-col">
                    <span>{col}</span>
                    <span className="text-xs font-normal text-gray-400 mt-0.5">
                      {preview.dtypes[col]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                  {rowIdx + 1}
                </td>
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-2 text-gray-700 whitespace-nowrap"
                  >
                    {cell === null || cell === undefined
                      ? <span className="text-gray-300 italic">null</span>
                      : typeof cell === "number"
                      ? cell.toFixed ? (Number.isInteger(cell) ? cell : cell.toFixed(4)) : cell
                      : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer with row info */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
        Showing {displayData.length} of {preview.total_rows} rows
      </div>
    </div>
  );
}

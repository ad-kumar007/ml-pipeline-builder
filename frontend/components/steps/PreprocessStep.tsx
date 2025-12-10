"use client";

import React, { useState } from "react";
import { Settings, Loader2, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import DataTable from "@/components/pipeline/DataTable";
import { preprocessData, resetPreprocessing, DataPreview, DatasetInfo } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PreprocessStepProps {
  datasetInfo: DatasetInfo | null;
  preview: DataPreview | null;
  transformations: string[];
  onPreviewUpdate: (preview: DataPreview, transformations: string[]) => void;
  onComplete: () => void;
}

export default function PreprocessStep({
  datasetInfo,
  preview,
  transformations,
  onPreviewUpdate,
  onComplete,
}: PreprocessStepProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"standardize" | "normalize" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!datasetInfo || !preview) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Please upload a dataset first
        </CardContent>
      </Card>
    );
  }

  // Get numeric columns only
  const numericColumns = datasetInfo.column_names.filter(
    (col) => datasetInfo.dtypes[col]?.includes("int") || datasetInfo.dtypes[col]?.includes("float")
  );

  const toggleColumn = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const selectAllNumeric = () => {
    setSelectedColumns(numericColumns);
  };

  const clearSelection = () => {
    setSelectedColumns([]);
  };

  const handleApplyTransformation = async () => {
    if (!selectedMethod || selectedColumns.length === 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await preprocessData(selectedColumns, selectedMethod);
      if (response.success) {
        onPreviewUpdate(response.preview, response.transformations_applied);
        setSelectedColumns([]);
        setSelectedMethod(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to apply transformation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const response = await resetPreprocessing();
      if (response.success) {
        onPreviewUpdate(response.preview, []);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Data Preprocessing
          </CardTitle>
          <CardDescription>
            Apply transformations to prepare your data for machine learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transformation Methods */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Select Transformation Method:</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedMethod("standardize")}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectedMethod === "standardize"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    selectedMethod === "standardize" ? "bg-blue-500 text-white" : "bg-gray-100"
                  )}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Standardization</p>
                    <p className="text-xs text-gray-500">StandardScaler (z-score)</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Transforms data to have mean=0 and std=1
                </p>
              </button>

              <button
                onClick={() => setSelectedMethod("normalize")}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectedMethod === "normalize"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    selectedMethod === "normalize" ? "bg-blue-500 text-white" : "bg-gray-100"
                  )}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Normalization</p>
                    <p className="text-xs text-gray-500">MinMaxScaler (0-1)</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Scales data to range [0, 1]
                </p>
              </button>
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Select Columns to Transform:</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllNumeric}>
                  Select All Numeric
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>

            {numericColumns.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No numeric columns available</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {numericColumns.map((col) => (
                  <label
                    key={col}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedColumns.includes(col)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Checkbox
                      checked={selectedColumns.includes(col)}
                      onCheckedChange={() => toggleColumn(col)}
                    />
                    <span className="text-sm">{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleApplyTransformation}
              disabled={!selectedMethod || selectedColumns.length === 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Apply Transformation
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isLoading}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applied Transformations */}
      {transformations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Applied Transformations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {transformations.map((t, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Preview</CardTitle>
          <CardDescription>
            {transformations.length > 0 ? "Transformed data" : "Original data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable preview={preview} maxRows={10} />
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button onClick={onComplete} variant="success" size="lg">
          Continue to Split
        </Button>
      </div>
    </div>
  );
}

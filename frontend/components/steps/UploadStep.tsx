"use client";

import React, { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataTable from "@/components/pipeline/DataTable";
import { uploadDataset, DatasetInfo, DataPreview } from "@/lib/api";

interface UploadStepProps {
  onComplete: (info: DatasetInfo, preview: DataPreview) => void;
  datasetInfo: DatasetInfo | null;
  preview: DataPreview | null;
}

export default function UploadStep({ onComplete, datasetInfo, preview }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await uploadDataset(file);
      if (response.success) {
        onComplete(response.dataset_info, response.preview);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to upload file. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Upload Dataset
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel file to begin building your ML pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
              ${isLoading ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />

            <div className="flex flex-col items-center gap-4">
              {isLoading ? (
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                </div>
              )}

              <div>
                <p className="text-lg font-medium text-gray-700">
                  {isLoading ? "Uploading..." : "Drop your file here"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse (CSV, Excel)
                </p>
              </div>

              {!isLoading && (
                <Button variant="outline" className="mt-2">
                  Select File
                </Button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Upload Failed</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dataset Info */}
      {datasetInfo && preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Dataset Loaded
            </CardTitle>
            <CardDescription>
              {datasetInfo.filename || "Dataset"} uploaded successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{datasetInfo.rows.toLocaleString()}</p>
                <p className="text-sm text-blue-600">Rows</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{datasetInfo.columns}</p>
                <p className="text-sm text-green-600">Columns</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {Object.values(datasetInfo.dtypes).filter(d => d.includes("int") || d.includes("float")).length}
                </p>
                <p className="text-sm text-purple-600">Numeric</p>
              </div>
            </div>

            {/* Column List */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Columns:</p>
              <div className="flex flex-wrap gap-2">
                {datasetInfo.column_names.map((col, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    {col}
                    <span className="text-xs text-gray-400 ml-1">
                      ({datasetInfo.dtypes[col]})
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <DataTable preview={preview} maxRows={5} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

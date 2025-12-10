"use client";

import React, { useState } from "react";
import { Split, Loader2, CheckCircle2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { splitData, DatasetInfo, SplitInfo } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SplitStepProps {
  datasetInfo: DatasetInfo | null;
  onComplete: (splitInfo: SplitInfo) => void;
  splitInfo: SplitInfo | null;
}

export default function SplitStep({ datasetInfo, onComplete, splitInfo }: SplitStepProps) {
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [testSize, setTestSize] = useState<number>(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!datasetInfo) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Please upload a dataset first
        </CardContent>
      </Card>
    );
  }

  const handleSplit = async () => {
    if (!targetColumn) {
      setError("Please select a target column");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await splitData(targetColumn, testSize / 100);
      if (response.success) {
        onComplete(response.split_info);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to split data. Check if backend is running.";
      setError(errorMsg);
      console.error("Split error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const trainSize = 100 - testSize;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Split className="w-5 h-5 text-blue-500" />
            Train-Test Split
          </CardTitle>
          <CardDescription>
            Split your dataset into training and testing sets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Column Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Target Column (what you want to predict):
            </label>
            <Select value={targetColumn} onValueChange={setTargetColumn}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose target column..." />
              </SelectTrigger>
              <SelectContent>
                {datasetInfo.column_names.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                    <span className="text-xs text-gray-400 ml-2">
                      ({datasetInfo.dtypes[col]})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split Ratio Slider */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-4 block">
              Split Ratio:
            </label>
            
            {/* Visual Split Bar */}
            <div className="mb-4">
              <div className="flex rounded-lg overflow-hidden h-12 border">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white font-medium transition-all duration-300"
                  style={{ width: `${trainSize}%` }}
                >
                  Train {trainSize}%
                </div>
                <div
                  className="bg-orange-500 flex items-center justify-center text-white font-medium transition-all duration-300"
                  style={{ width: `${testSize}%` }}
                >
                  Test {testSize}%
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="px-2">
              <Slider
                value={[testSize]}
                onValueChange={(value) => setTestSize(value[0])}
                min={10}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>10% test</span>
                <span>50% test</span>
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex gap-2 mt-4">
              {[
                { label: "70-30", test: 30 },
                { label: "80-20", test: 20 },
                { label: "90-10", test: 10 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setTestSize(preset.test)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    testSize === preset.test
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Split Button */}
          <Button
            onClick={handleSplit}
            disabled={!targetColumn || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Split className="w-4 h-4 mr-2" />
            )}
            Split Data
          </Button>
        </CardContent>
      </Card>

      {/* Split Results */}
      {splitInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Data Split Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-blue-700">Training Set</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {splitInfo.train_samples.toLocaleString()}
                </p>
                <p className="text-sm text-blue-500">samples ({splitInfo.train_ratio}%)</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-orange-700">Test Set</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {splitInfo.test_samples.toLocaleString()}
                </p>
                <p className="text-sm text-orange-500">samples ({splitInfo.test_ratio}%)</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Target:</span> {splitInfo.target_column}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Features:</span> {splitInfo.num_features} columns
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Classes:</span>{" "}
                {splitInfo.target_classes.map((c) => String(c)).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

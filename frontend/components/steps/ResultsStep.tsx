"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Loader2, CheckCircle2, Target, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getResults, ResultsResponse, TrainResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ResultsStepProps {
  trainInfo: TrainResponse["model_info"] | null;
}

export default function ResultsStep({ trainInfo }: ResultsStepProps) {
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await getResults();
      if (response.success) {
        setResults(response);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to get results");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trainInfo) {
      fetchResults();
    }
  }, [trainInfo]);

  if (!trainInfo) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Please train a model first
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-500">Evaluating model...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchResults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return null;
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-600";
    if (accuracy >= 70) return "text-blue-600";
    if (accuracy >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 90) return "bg-green-50 border-green-200";
    if (accuracy >= 70) return "bg-blue-50 border-blue-200";
    if (accuracy >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Accuracy Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Model Results
          </CardTitle>
          <CardDescription>
            Performance metrics for {results.results.model_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Accuracy */}
            <div className={cn("rounded-xl p-6 border-2", getAccuracyBg(results.results.accuracy))}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5" />
                <span className="font-medium">Accuracy</span>
              </div>
              <p className={cn("text-4xl font-bold", getAccuracyColor(results.results.accuracy))}>
                {results.results.accuracy}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {results.results.accuracy >= 70 ? "Good performance" : "May need improvement"}
              </p>
            </div>

            {/* Model */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-purple-700">Model</span>
              </div>
              <p className="text-lg font-semibold text-purple-600">
                {results.results.model_name}
              </p>
              <p className="text-sm text-purple-500 mt-1">Classification</p>
            </div>

            {/* Test Samples */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Test Samples</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">
                {results.results.test_samples.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">evaluated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confusion Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confusion Matrix</CardTitle>
          <CardDescription>
            Shows how predictions compare to actual values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <img
              src={`data:image/png;base64,${results.visualizations.confusion_matrix.image}`}
              alt="Confusion Matrix"
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Model-Specific Visualization */}
      {results.visualizations.model_specific && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {results.visualizations.model_specific.title}
            </CardTitle>
            <CardDescription>
              {results.results.model_name === "Decision Tree Classifier"
                ? "Visual representation of the decision tree structure"
                : "Shows the importance of each feature in making predictions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center overflow-x-auto">
              <img
                src={`data:image/png;base64,${results.visualizations.model_specific.image}`}
                alt={results.visualizations.model_specific.title}
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Pipeline Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 rounded-xl p-6">
            <p className="text-green-700">
              Your ML pipeline has been successfully completed. The{" "}
              <span className="font-semibold">{results.results.model_name}</span> achieved an
              accuracy of <span className="font-semibold">{results.results.accuracy}%</span> on the
              test set.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={fetchResults}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

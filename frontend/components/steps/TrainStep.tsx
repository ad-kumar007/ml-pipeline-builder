"use client";

import React, { useState } from "react";
import { Brain, Loader2, CheckCircle2, TreeDeciduous, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trainModel, SplitInfo, TrainResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TrainStepProps {
  splitInfo: SplitInfo | null;
  onComplete: (trainInfo: TrainResponse["model_info"]) => void;
  trainInfo: TrainResponse["model_info"] | null;
}

const models = [
  {
    id: "logistic_regression",
    name: "Logistic Regression",
    description: "Linear model for classification. Fast and interpretable.",
    icon: <TrendingUp className="w-8 h-8" />,
    color: "blue",
    pros: ["Fast training", "Interpretable", "Works well with linear data"],
  },
  {
    id: "decision_tree",
    name: "Decision Tree",
    description: "Tree-based model that learns decision rules.",
    icon: <TreeDeciduous className="w-8 h-8" />,
    color: "green",
    pros: ["Visual interpretation", "Handles non-linear data", "No scaling needed"],
  },
];

export default function TrainStep({ splitInfo, onComplete, trainInfo }: TrainStepProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!splitInfo) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Please split your data first
        </CardContent>
      </Card>
    );
  }

  const handleTrain = async () => {
    if (!selectedModel) {
      setError("Please select a model");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await trainModel(selectedModel);
      if (response.success) {
        onComplete(response.model_info);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to train model");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            Model Selection
          </CardTitle>
          <CardDescription>
            Choose a machine learning model to train on your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Cards */}
          <div className="grid grid-cols-2 gap-4">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "p-6 rounded-xl border-2 text-left transition-all duration-300",
                  selectedModel === model.id
                    ? model.color === "blue"
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-green-500 bg-green-50 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 hover:shadow"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center mb-4",
                    selectedModel === model.id
                      ? model.color === "blue"
                        ? "bg-blue-500 text-white"
                        : "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {model.icon}
                </div>

                {/* Title */}
                <h3
                  className={cn(
                    "text-lg font-semibold mb-1",
                    selectedModel === model.id
                      ? model.color === "blue"
                        ? "text-blue-700"
                        : "text-green-700"
                      : "text-gray-700"
                  )}
                >
                  {model.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 mb-3">{model.description}</p>

                {/* Pros */}
                <ul className="space-y-1">
                  {model.pros.map((pro, idx) => (
                    <li key={idx} className="text-xs text-gray-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {pro}
                    </li>
                  ))}
                </ul>

                {/* Selection Indicator */}
                {selectedModel === model.id && (
                  <div
                    className={cn(
                      "mt-4 py-1 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1",
                      model.color === "blue"
                        ? "bg-blue-500 text-white"
                        : "bg-green-500 text-white"
                    )}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Training Info */}
          {selectedModel && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Training samples:</span>{" "}
                {splitInfo.train_samples.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Features:</span> {splitInfo.num_features}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Target:</span> {splitInfo.target_column}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Train Button */}
          <Button
            onClick={handleTrain}
            disabled={!selectedModel || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Training Model...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Train Model
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Training Complete */}
      {trainInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Model Trained Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-lg font-semibold text-green-700">{trainInfo.model_name}</p>
              <p className="text-sm text-green-600 mt-1">
                Trained on {trainInfo.training_samples.toLocaleString()} samples
              </p>
              <p className="text-sm text-green-600 mt-1">
                Using {trainInfo.features_used.length} features
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

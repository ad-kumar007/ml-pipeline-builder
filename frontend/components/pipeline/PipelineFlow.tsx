"use client";

import React from "react";
import {
  Upload,
  Settings,
  Split,
  Brain,
  BarChart3,
  ChevronRight,
  Check,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
}

interface PipelineFlowProps {
  currentStep: number;
  completedSteps: boolean[];
  onStepClick: (step: number) => void;
}

const steps = [
  {
    id: "upload",
    title: "Upload",
    description: "Load your dataset",
    icon: <Upload className="w-5 h-5" />,
  },
  {
    id: "preprocess",
    title: "Preprocess",
    description: "Transform data",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: "split",
    title: "Split",
    description: "Train/Test split",
    icon: <Split className="w-5 h-5" />,
  },
  {
    id: "train",
    title: "Train",
    description: "Select & train model",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    id: "results",
    title: "Results",
    description: "View performance",
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

export default function PipelineFlow({
  currentStep,
  completedSteps,
  onStepClick,
}: PipelineFlowProps) {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">ML Pipeline</h2>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps[index];
          const isActive = currentStep === index;
          const isClickable = index === 0 || completedSteps[index - 1];

          return (
            <React.Fragment key={step.id}>
              {/* Step Block */}
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center p-4 rounded-xl transition-all duration-300 min-w-[120px]",
                  isActive && "bg-blue-50 border-2 border-blue-500 shadow-md",
                  isCompleted && !isActive && "bg-green-50 border-2 border-green-500",
                  !isActive && !isCompleted && "bg-gray-50 border-2 border-gray-200",
                  isClickable && !isActive && "hover:bg-gray-100 cursor-pointer",
                  !isClickable && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Icon with status indicator */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                    isActive && "bg-blue-500 text-white",
                    isCompleted && !isActive && "bg-green-500 text-white",
                    !isActive && !isCompleted && "bg-gray-200 text-gray-500"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Title */}
                <span
                  className={cn(
                    "font-medium text-sm",
                    isActive && "text-blue-700",
                    isCompleted && !isActive && "text-green-700",
                    !isActive && !isCompleted && "text-gray-500"
                  )}
                >
                  {step.title}
                </span>

                {/* Description */}
                <span className="text-xs text-gray-400 mt-1">
                  {step.description}
                </span>

                {/* Status badge */}
                <div className="mt-2">
                  {isCompleted ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      Done
                    </span>
                  ) : isActive ? (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </button>

              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="flex-1 flex items-center justify-center px-2">
                  <div
                    className={cn(
                      "h-1 flex-1 rounded transition-colors",
                      completedSteps[index] ? "bg-green-400" : "bg-gray-200"
                    )}
                  />
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 mx-1",
                      completedSteps[index] ? "text-green-500" : "text-gray-300"
                    )}
                  />
                  <div
                    className={cn(
                      "h-1 flex-1 rounded transition-colors",
                      completedSteps[index] ? "bg-green-400" : "bg-gray-200"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

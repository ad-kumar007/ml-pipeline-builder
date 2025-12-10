"use client";

import React, { useState } from "react";
import { Sparkles, RotateCcw, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import PipelineFlow from "@/components/pipeline/PipelineFlow";
import UploadStep from "@/components/steps/UploadStep";
import PreprocessStep from "@/components/steps/PreprocessStep";
import SplitStep from "@/components/steps/SplitStep";
import TrainStep from "@/components/steps/TrainStep";
import ResultsStep from "@/components/steps/ResultsStep";
import { DatasetInfo, DataPreview, SplitInfo, TrainResponse, resetPipeline } from "@/lib/api";

export default function Home() {
  // Pipeline state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([false, false, false, false, false]);

  // Data state
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [preview, setPreview] = useState<DataPreview | null>(null);
  const [transformations, setTransformations] = useState<string[]>([]);
  const [splitInfo, setSplitInfo] = useState<SplitInfo | null>(null);
  const [trainInfo, setTrainInfo] = useState<TrainResponse["model_info"] | null>(null);

  // Step completion handlers
  const handleUploadComplete = (info: DatasetInfo, previewData: DataPreview) => {
    setDatasetInfo(info);
    setPreview(previewData);
    setCompletedSteps([true, false, false, false, false]);
    setCurrentStep(1);
  };

  const handlePreviewUpdate = (previewData: DataPreview, appliedTransformations: string[]) => {
    setPreview(previewData);
    setTransformations(appliedTransformations);
  };

  const handlePreprocessComplete = () => {
    setCompletedSteps([true, true, false, false, false]);
    setCurrentStep(2);
  };

  const handleSplitComplete = (info: SplitInfo) => {
    setSplitInfo(info);
    setCompletedSteps([true, true, true, false, false]);
    setCurrentStep(3);
  };

  const handleTrainComplete = (info: TrainResponse["model_info"]) => {
    setTrainInfo(info);
    setCompletedSteps([true, true, true, true, true]);
    setCurrentStep(4);
  };

  const handleReset = async () => {
    try {
      await resetPipeline();
    } catch (e) {
      // Ignore errors on reset
    }
    setCurrentStep(0);
    setCompletedSteps([false, false, false, false, false]);
    setDatasetInfo(null);
    setPreview(null);
    setTransformations([]);
    setSplitInfo(null);
    setTrainInfo(null);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <UploadStep
            onComplete={handleUploadComplete}
            datasetInfo={datasetInfo}
            preview={preview}
          />
        );
      case 1:
        return (
          <PreprocessStep
            datasetInfo={datasetInfo}
            preview={preview}
            transformations={transformations}
            onPreviewUpdate={handlePreviewUpdate}
            onComplete={handlePreprocessComplete}
          />
        );
      case 2:
        return (
          <SplitStep
            datasetInfo={datasetInfo}
            onComplete={handleSplitComplete}
            splitInfo={splitInfo}
          />
        );
      case 3:
        return (
          <TrainStep
            splitInfo={splitInfo}
            onComplete={handleTrainComplete}
            trainInfo={trainInfo}
          />
        );
      case 4:
        return <ResultsStep trainInfo={trainInfo} />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">ML Pipeline Builder</h1>
                <p className="text-xs text-gray-500">No-Code Machine Learning</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Pipeline
              </Button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pipeline Flow */}
        <PipelineFlow
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />

        {/* Current Step Content */}
        <div className="mt-6">{renderCurrentStep()}</div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Built with Next.js, FastAPI & scikit-learn</p>
            <p>No-Code ML Pipeline Builder</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

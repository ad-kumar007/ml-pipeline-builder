import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface DatasetInfo {
  filename?: string;
  rows: number;
  columns: number;
  column_names: string[];
  dtypes: Record<string, string>;
}

export interface DataPreview {
  columns: string[];
  data: any[][];
  dtypes: Record<string, string>;
  total_rows: number;
  preview_rows: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  dataset_info: DatasetInfo;
  preview: DataPreview;
}

export interface PreprocessResponse {
  success: boolean;
  message: string;
  preview: DataPreview;
  transformations_applied: string[];
}

export interface SplitInfo {
  train_samples: number;
  test_samples: number;
  train_ratio: number;
  test_ratio: number;
  target_column: string;
  feature_columns: string[];
  num_features: number;
  target_classes: any[];
}

export interface SplitResponse {
  success: boolean;
  message: string;
  split_info: SplitInfo;
}

export interface TrainResponse {
  success: boolean;
  message: string;
  model_info: {
    model_type: string;
    model_name: string;
    training_samples: number;
    features_used: string[];
  };
}

export interface ResultsResponse {
  success: boolean;
  message: string;
  results: {
    model_name: string;
    accuracy: number;
    accuracy_decimal: number;
    test_samples: number;
    confusion_matrix: number[][];
  };
  visualizations: {
    confusion_matrix: {
      title: string;
      image: string;
    };
    model_specific: {
      title: string;
      image: string;
    } | null;
  };
}

export interface PipelineStatus {
  upload: boolean;
  preprocess: boolean;
  split: boolean;
  train: boolean;
  results: boolean;
  details: {
    dataset_rows: number;
    transformations: string[];
    model_name: string | null;
    target_column: string | null;
  };
}

// API Functions
export const uploadDataset = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getDataset = async () => {
  const response = await api.get('/dataset');
  return response.data;
};

export const preprocessData = async (columns: string[], method: string): Promise<PreprocessResponse> => {
  const response = await api.post('/preprocess', { columns, method });
  return response.data;
};

export const resetPreprocessing = async () => {
  const response = await api.post('/reset-preprocessing');
  return response.data;
};

export const splitData = async (
  target_column: string,
  test_size: number,
  random_state: number = 42
): Promise<SplitResponse> => {
  const response = await api.post('/split', {
    target_column,
    test_size,
    random_state,
  });
  return response.data;
};

export const trainModel = async (model_type: string): Promise<TrainResponse> => {
  const response = await api.post('/train', { model_type });
  return response.data;
};

export const getResults = async (): Promise<ResultsResponse> => {
  const response = await api.get('/results');
  return response.data;
};

export const getPipelineStatus = async (): Promise<PipelineStatus> => {
  const response = await api.get('/pipeline-status');
  return response.data;
};

export const resetPipeline = async () => {
  const response = await api.post('/reset');
  return response.data;
};

export default api;

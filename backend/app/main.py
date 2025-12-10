"""
FastAPI Backend for No-Code ML Pipeline Builder
Handles dataset upload, preprocessing, train-test split, model training, and results
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.metrics import accuracy_score, confusion_matrix
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import json
import os

app = FastAPI(title="ML Pipeline Builder API", version="1.0.0")

# CORS middleware for frontend communication - allow all origins for deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session state (for simplicity; use Redis/DB in production)
session_state: Dict[str, Any] = {
    "original_df": None,
    "processed_df": None,
    "X_train": None,
    "X_test": None,
    "y_train": None,
    "y_test": None,
    "target_column": None,
    "feature_columns": None,
    "model": None,
    "model_name": None,
    "transformations_applied": [],
}


# Pydantic models for request/response
class PreprocessRequest(BaseModel):
    columns: List[str]
    method: str  # "standardize" or "normalize"


class SplitRequest(BaseModel):
    target_column: str
    test_size: float = 0.2
    random_state: int = 42


class TrainRequest(BaseModel):
    model_type: str  # "logistic_regression" or "decision_tree"


def df_to_json(df: pd.DataFrame, max_rows: int = 100) -> Dict:
    """Convert DataFrame to JSON-serializable format with preview"""
    preview_df = df.head(max_rows).copy()
    # Replace NaN/Inf with None for JSON compatibility
    preview_df = preview_df.replace([np.inf, -np.inf], np.nan)
    preview_df = preview_df.where(pd.notnull(preview_df), None)
    return {
        "columns": df.columns.tolist(),
        "data": preview_df.values.tolist(),
        "dtypes": df.dtypes.astype(str).to_dict(),
        "total_rows": len(df),
        "preview_rows": len(preview_df),
    }


def fig_to_base64(fig) -> str:
    """Convert matplotlib figure to base64 string"""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_base64


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "message": "ML Pipeline Builder API is running"}


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload CSV or Excel file and store in session state
    Returns dataset info and preview
    """
    try:
        # Validate file type
        filename = file.filename.lower()
        if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)"
            )
        
        # Read file content
        content = await file.read()
        
        # Parse based on file type
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Validate dataset
        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file is empty")
        
        if len(df.columns) < 2:
            raise HTTPException(
                status_code=400,
                detail="Dataset must have at least 2 columns (features + target)"
            )
        
        # Handle NaN and Inf values - replace Inf with NaN, then fill NaN with 0 for numeric columns
        df = df.replace([np.inf, -np.inf], np.nan)
        
        # Store in session state
        session_state["original_df"] = df.copy()
        session_state["processed_df"] = df.copy()
        session_state["transformations_applied"] = []
        
        # Reset downstream state
        session_state["X_train"] = None
        session_state["X_test"] = None
        session_state["y_train"] = None
        session_state["y_test"] = None
        session_state["model"] = None
        
        # Count NaN values for info
        nan_count = int(df.isna().sum().sum())
        
        return JSONResponse({
            "success": True,
            "message": f"Successfully uploaded {file.filename}" + (f" ({nan_count} missing values detected)" if nan_count > 0 else ""),
            "dataset_info": {
                "filename": file.filename,
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "dtypes": df.dtypes.astype(str).to_dict(),
            },
            "preview": df_to_json(df),
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")


@app.get("/dataset")
async def get_dataset():
    """Get current dataset info and preview"""
    if session_state["processed_df"] is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a dataset first.")
    
    df = session_state["processed_df"]
    return JSONResponse({
        "success": True,
        "dataset_info": {
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict(),
        },
        "preview": df_to_json(df),
        "transformations_applied": session_state["transformations_applied"],
    })


@app.post("/preprocess")
async def preprocess_data(request: PreprocessRequest):
    """
    Apply preprocessing transformations to selected columns
    Supports: standardization (StandardScaler) and normalization (MinMaxScaler)
    """
    if session_state["processed_df"] is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a dataset first.")
    
    df = session_state["processed_df"].copy()
    
    # Validate columns
    invalid_cols = [col for col in request.columns if col not in df.columns]
    if invalid_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid columns: {invalid_cols}. Available columns: {df.columns.tolist()}"
        )
    
    # Check if columns are numeric
    non_numeric = [col for col in request.columns if not np.issubdtype(df[col].dtype, np.number)]
    if non_numeric:
        raise HTTPException(
            status_code=400,
            detail=f"Columns must be numeric for transformation: {non_numeric}"
        )
    
    # Apply transformation
    try:
        if request.method == "standardize":
            scaler = StandardScaler()
            method_name = "StandardScaler (z-score normalization)"
        elif request.method == "normalize":
            scaler = MinMaxScaler()
            method_name = "MinMaxScaler (0-1 normalization)"
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid method. Use 'standardize' or 'normalize'"
            )
        
        # Apply scaler to selected columns
        df[request.columns] = scaler.fit_transform(df[request.columns])
        
        # Update session state
        session_state["processed_df"] = df
        transformation_msg = f"Applied {method_name} to columns: {request.columns}"
        session_state["transformations_applied"].append(transformation_msg)
        
        return JSONResponse({
            "success": True,
            "message": transformation_msg,
            "preview": df_to_json(df),
            "transformations_applied": session_state["transformations_applied"],
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error during preprocessing: {str(e)}")


@app.post("/reset-preprocessing")
async def reset_preprocessing():
    """Reset dataset to original state (undo all preprocessing)"""
    if session_state["original_df"] is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded.")
    
    session_state["processed_df"] = session_state["original_df"].copy()
    session_state["transformations_applied"] = []
    
    return JSONResponse({
        "success": True,
        "message": "Dataset reset to original state",
        "preview": df_to_json(session_state["processed_df"]),
    })


@app.post("/split")
async def split_data(request: SplitRequest):
    """
    Split dataset into train and test sets
    Stores X_train, X_test, y_train, y_test in session state
    """
    if session_state["processed_df"] is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a dataset first.")
    
    df = session_state["processed_df"]
    
    # Validate target column
    if request.target_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Target column '{request.target_column}' not found. Available: {df.columns.tolist()}"
        )
    
    # Validate test size
    if not 0.1 <= request.test_size <= 0.5:
        raise HTTPException(
            status_code=400,
            detail="Test size must be between 0.1 (10%) and 0.5 (50%)"
        )
    
    try:
        # Separate features and target
        X = df.drop(columns=[request.target_column])
        y = df[request.target_column]
        
        # Handle non-numeric features (simple encoding for demo)
        X_encoded = X.copy()
        for col in X_encoded.columns:
            if X_encoded[col].dtype == 'object':
                X_encoded[col] = pd.factorize(X_encoded[col])[0]
        
        # Perform split
        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y,
            test_size=request.test_size,
            random_state=request.random_state,
            stratify=y if len(y.unique()) > 1 else None
        )
        
        # Store in session state
        session_state["X_train"] = X_train
        session_state["X_test"] = X_test
        session_state["y_train"] = y_train
        session_state["y_test"] = y_test
        session_state["target_column"] = request.target_column
        session_state["feature_columns"] = X.columns.tolist()
        
        # Reset model when split changes
        session_state["model"] = None
        session_state["model_name"] = None
        
        train_ratio = int((1 - request.test_size) * 100)
        test_ratio = int(request.test_size * 100)
        
        return JSONResponse({
            "success": True,
            "message": f"Data split successfully ({train_ratio}% train, {test_ratio}% test)",
            "split_info": {
                "train_samples": len(X_train),
                "test_samples": len(X_test),
                "train_ratio": train_ratio,
                "test_ratio": test_ratio,
                "target_column": request.target_column,
                "feature_columns": X.columns.tolist(),
                "num_features": len(X.columns),
                "target_classes": y.unique().tolist(),
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error during split: {str(e)}")


@app.post("/train")
async def train_model(request: TrainRequest):
    """
    Train selected model on the split data
    Supports: Logistic Regression, Decision Tree Classifier
    """
    # Validate prerequisites
    if session_state["X_train"] is None:
        raise HTTPException(
            status_code=400,
            detail="Data not split. Please perform train-test split first."
        )
    
    X_train = session_state["X_train"]
    y_train = session_state["y_train"]
    
    try:
        # Select and train model
        if request.model_type == "logistic_regression":
            model = LogisticRegression(max_iter=1000, random_state=42)
            model_name = "Logistic Regression"
        elif request.model_type == "decision_tree":
            model = DecisionTreeClassifier(max_depth=5, random_state=42)
            model_name = "Decision Tree Classifier"
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid model type. Use 'logistic_regression' or 'decision_tree'"
            )
        
        # Train the model
        model.fit(X_train, y_train)
        
        # Store in session state
        session_state["model"] = model
        session_state["model_name"] = model_name
        
        return JSONResponse({
            "success": True,
            "message": f"{model_name} trained successfully!",
            "model_info": {
                "model_type": request.model_type,
                "model_name": model_name,
                "training_samples": len(X_train),
                "features_used": session_state["feature_columns"],
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error during training: {str(e)}")


@app.get("/results")
async def get_results():
    """
    Get model evaluation results including accuracy and visualizations
    Returns confusion matrix and feature importance/decision tree plot
    """
    if session_state["model"] is None:
        raise HTTPException(
            status_code=400,
            detail="No model trained. Please train a model first."
        )
    
    model = session_state["model"]
    model_name = session_state["model_name"]
    X_test = session_state["X_test"]
    y_test = session_state["y_test"]
    feature_columns = session_state["feature_columns"]
    
    try:
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate accuracy
        accuracy = accuracy_score(y_test, y_pred)
        
        # Generate confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        
        # Create confusion matrix visualization
        fig_cm, ax_cm = plt.subplots(figsize=(8, 6))
        sns.heatmap(
            cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=sorted(y_test.unique()),
            yticklabels=sorted(y_test.unique()),
            ax=ax_cm
        )
        ax_cm.set_xlabel('Predicted Label', fontsize=12)
        ax_cm.set_ylabel('True Label', fontsize=12)
        ax_cm.set_title('Confusion Matrix', fontsize=14, fontweight='bold')
        cm_base64 = fig_to_base64(fig_cm)
        
        # Generate model-specific visualization
        model_viz_base64 = None
        viz_title = None
        
        if isinstance(model, DecisionTreeClassifier):
            # Decision Tree Plot
            fig_tree, ax_tree = plt.subplots(figsize=(20, 10))
            plot_tree(
                model,
                feature_names=feature_columns,
                class_names=[str(c) for c in sorted(y_test.unique())],
                filled=True,
                rounded=True,
                ax=ax_tree,
                fontsize=10
            )
            ax_tree.set_title('Decision Tree Visualization', fontsize=14, fontweight='bold')
            model_viz_base64 = fig_to_base64(fig_tree)
            viz_title = "Decision Tree Structure"
            
        elif isinstance(model, LogisticRegression):
            # Feature Importance (coefficients)
            fig_imp, ax_imp = plt.subplots(figsize=(10, 6))
            
            # Get coefficients (handle multi-class)
            if len(model.coef_.shape) > 1 and model.coef_.shape[0] > 1:
                importance = np.mean(np.abs(model.coef_), axis=0)
            else:
                importance = np.abs(model.coef_).flatten()
            
            # Sort by importance
            indices = np.argsort(importance)[::-1]
            sorted_features = [feature_columns[i] for i in indices]
            sorted_importance = importance[indices]
            
            # Create bar plot
            colors = plt.cm.Blues(np.linspace(0.4, 0.8, len(sorted_features)))
            bars = ax_imp.barh(range(len(sorted_features)), sorted_importance, color=colors)
            ax_imp.set_yticks(range(len(sorted_features)))
            ax_imp.set_yticklabels(sorted_features)
            ax_imp.invert_yaxis()
            ax_imp.set_xlabel('Absolute Coefficient Value', fontsize=12)
            ax_imp.set_title('Feature Importance (Logistic Regression)', fontsize=14, fontweight='bold')
            
            # Add value labels
            for bar, val in zip(bars, sorted_importance):
                ax_imp.text(val + 0.01, bar.get_y() + bar.get_height()/2, 
                           f'{val:.3f}', va='center', fontsize=9)
            
            plt.tight_layout()
            model_viz_base64 = fig_to_base64(fig_imp)
            viz_title = "Feature Importance"
        
        return JSONResponse({
            "success": True,
            "message": "Model evaluation complete!",
            "results": {
                "model_name": model_name,
                "accuracy": round(accuracy * 100, 2),
                "accuracy_decimal": round(accuracy, 4),
                "test_samples": len(y_test),
                "confusion_matrix": cm.tolist(),
            },
            "visualizations": {
                "confusion_matrix": {
                    "title": "Confusion Matrix",
                    "image": cm_base64,
                },
                "model_specific": {
                    "title": viz_title,
                    "image": model_viz_base64,
                } if model_viz_base64 else None,
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating results: {str(e)}")


@app.get("/pipeline-status")
async def get_pipeline_status():
    """Get current status of all pipeline steps"""
    return JSONResponse({
        "upload": session_state["original_df"] is not None,
        "preprocess": len(session_state["transformations_applied"]) > 0,
        "split": session_state["X_train"] is not None,
        "train": session_state["model"] is not None,
        "results": session_state["model"] is not None,
        "details": {
            "dataset_rows": len(session_state["original_df"]) if session_state["original_df"] is not None else 0,
            "transformations": session_state["transformations_applied"],
            "model_name": session_state["model_name"],
            "target_column": session_state["target_column"],
        }
    })


@app.post("/reset")
async def reset_pipeline():
    """Reset entire pipeline to initial state"""
    global session_state
    session_state = {
        "original_df": None,
        "processed_df": None,
        "X_train": None,
        "X_test": None,
        "y_train": None,
        "y_test": None,
        "target_column": None,
        "feature_columns": None,
        "model": None,
        "model_name": None,
        "transformations_applied": [],
    }
    return JSONResponse({
        "success": True,
        "message": "Pipeline reset successfully"
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

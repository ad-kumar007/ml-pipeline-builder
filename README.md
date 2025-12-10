# 🚀 No-Code ML Pipeline Builder

A beautiful, intuitive web application for building machine learning pipelines without writing code. Built with **Next.js**, **FastAPI**, and **scikit-learn**.

![ML Pipeline Builder](https://via.placeholder.com/800x400?text=ML+Pipeline+Builder)

## ✨ Features

- **📤 Dataset Upload** - Upload CSV or Excel files with instant preview
- **⚙️ Data Preprocessing** - Apply StandardScaler or MinMaxScaler transformations
- **✂️ Train-Test Split** - Configurable split ratios with visual feedback
- **🧠 Model Selection** - Choose between Logistic Regression and Decision Tree
- **📊 Results & Visualizations** - Accuracy metrics, confusion matrix, and feature importance

## 🏗️ Architecture

```
ml-pipeline-builder/
├── frontend/          # Next.js + Tailwind CSS + ShadCN
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   │   ├── ui/        # ShadCN UI components
│   │   ├── pipeline/  # Pipeline-specific components
│   │   └── steps/     # Step components (Upload, Preprocess, etc.)
│   └── lib/           # Utilities and API client
│
├── backend/           # FastAPI + scikit-learn
│   └── app/
│       └── main.py    # All API endpoints
│
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS
- **ShadCN/UI** - Beautiful, accessible components
- **Lucide Icons** - Modern icon library
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **scikit-learn** - Machine learning library
- **pandas** - Data manipulation
- **matplotlib/seaborn** - Visualizations

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.9+** and pip

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd ml-pipeline-builder/backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ml-pipeline-builder/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/upload` | POST | Upload CSV/Excel dataset |
| `/dataset` | GET | Get current dataset info |
| `/preprocess` | POST | Apply transformations |
| `/reset-preprocessing` | POST | Reset to original data |
| `/split` | POST | Train-test split |
| `/train` | POST | Train selected model |
| `/results` | GET | Get model results & visualizations |
| `/pipeline-status` | GET | Get pipeline step status |
| `/reset` | POST | Reset entire pipeline |

## 🎯 Usage Guide

### Step 1: Upload Dataset
- Drag & drop or click to upload a CSV/Excel file
- View dataset statistics and preview

### Step 2: Preprocess Data
- Select numeric columns to transform
- Choose StandardScaler (z-score) or MinMaxScaler (0-1)
- Apply multiple transformations or reset

### Step 3: Train-Test Split
- Select the target column (what to predict)
- Adjust split ratio using slider (10-50% test)
- Use quick presets: 70-30, 80-20, 90-10

### Step 4: Train Model
- Choose between Logistic Regression or Decision Tree
- Click "Train Model" to start training

### Step 5: View Results
- See accuracy score with color-coded feedback
- View confusion matrix visualization
- Explore feature importance or decision tree structure

## 📸 Screenshots

### Pipeline Flow
The visual pipeline shows your progress through each step:
- ✅ Completed steps are green
- 🔵 Current step is blue
- ⚪ Pending steps are gray

### Model Selection
Choose from available models with clear descriptions of their strengths.

### Results Dashboard
View comprehensive model performance metrics and visualizations.

## 🔧 Configuration

### Backend Port
Edit `backend/app/main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Frontend API URL
Edit `frontend/lib/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🙏 Acknowledgments

- Inspired by [Orange Data Mining](https://orangedatamining.com/)
- Built with [ShadCN/UI](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Happy Machine Learning! 🎉**

# 🌾 AgriVisionAI

**AgriVisionAI** is an AI‑powered software solution that helps farmers and agricultural researchers monitor crop health and detect plant diseases using **uploaded images or live camera input**.  
It also integrates **live weather detection** and an **AI chatbot** that interacts with farmers to resolve agricultural problems through both **text and speech**.

---

## 🚀 Project Overview
AgriVisionAI enables real‑time crop health monitoring through visual and conversational analysis.  
Users can upload plant images or use a connected camera to detect diseases, classify crop conditions, and visualize results instantly.  
The system combines **computer vision**, **weather intelligence**, and **AI‑driven conversation** to make precision agriculture accessible and interactive.

---

## 🧠 Key Features
- 🌱 **Crop Disease Detection** using YOLOv8‑based image classification and segmentation.  
- 📸 **Live Camera Integration** for real‑time crop analysis.  
- 🌤️ **Live Weather Detection** to analyze temperature, humidity, and rainfall impact on crop conditions.  
- 🗣️ **AI Chatbot Assistance** that interacts with farmers, answers queries, and helps resolve agricultural problems.  
- 🔊 **Text‑to‑Speech Support** so farmers can listen to responses in their local language for better accessibility.  
- 📊 **Interactive Dashboard** to visualize predictions, confidence levels, and weather data.  
- 💻 **Frontend Interface** built with React.js for smooth user interaction.  
- ⚙️ **Backend API** powered by Python and FastAPI for model inference and data management.

---

# 🗂️ Repository Structure

AgriVisionAI/
backend/              # FastAPI server and endpoints
frontend/             # React.js dashboard and UI components
ml_pipeline/          # Model training, evaluation, and inference scripts
runs/                 # YOLOv8 experiment outputs and logs
README.dataset.txt    # Dataset details and sources
README.roboflow.txt   # Roboflow dataset setup instructions
.gitignore            # Ignored files and directories

---

## ⚙️ Tech Stack
| Component | Technology |
|------------|-------------|
| Frontend | React.js, HTML, CSS |
| Backend | Python, FastAPI |
| ML/AI | YOLOv8, OpenCV, TensorFlow |
| Data Handling | Pandas, NumPy |
| Weather API | OpenWeatherMap or similar |
| Chatbot | NLP model (Dialogflow / custom transformer) |
| Speech | gTTS / pyttsx3 for text‑to‑speech |
| Deployment | GitHub, Docker (optional) |

---

## 📈 Future Enhancements
- Support for **multi‑crop classification** and disease severity scoring.  
- Integration with **cloud storage** for dataset management.  
- **Mobile app** for on‑field crop scanning and instant feedback.  
- **Voice‑based query system** for hands‑free interaction.

---

## 🧩 How to Run
1. Clone the repository:
   ```bash
   git clone https://github.com/laxmi-kumari475/AgriVisionAI.git
   cd AgriVisionAI
2. Set up the backend:
   cd backend
   pip install -r requirements.txt
uvicorn main:app --reload
3. Start the frontend:
   cd frontend
   npm run dev
   
---

## 🤝 Contributing
Contributions are welcome!
Please fork the repository, create a new branch, and submit a pull request.

---

## 📜 License
This project is licensed under the MIT License — feel free to use and modify it for educational or research purposes.

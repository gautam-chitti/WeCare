# WeCare: AI-Powered Integrated Healthcare Ecosystem

**WeCare** is a comprehensive digital healthcare platform designed to bridge the gap between patients, doctors, and pharmaceutical services. It leverages **Deep Learning (XGBoost)**, **RAG (Retrieval-Augmented Generation)**, and **FastAPI** to provide preliminary diagnostics, seamless appointment management, and an integrated pharmacy supply chain.

![System Architecture](Images/architecture_diagram.png)

## Key Features

-   **Smart Diagnostics:** Interactive Symptom Checker and AI-powered X-Ray Analysis (Fracture/TB detection) for rapid triage.
-   **Report Intelligence:** Uses **RAG** to parse and summarize complex medical PDF reports for patients.
-   **Integrated Pharmacy:** Direct ordering system linking digital prescriptions to the pharmacy inventory with real-time tracking.
-   **Voice Navigation:** A voice-command interface allowing elderly or disabled users to navigate the app hands-free.
-   **Unified Dashboards:** Dedicated, role-based interfaces for Patients and Doctors to manage health records and appointments.

## Application Screenshots

### Landing Page
The entry point for specialized care and intelligent diagnostics.
![Landing Page](Images/landing_page.png)

### Patient Journey
1.  **Dashboard:** A centralized hub for health stats, appointments, and quick actions.
    ![Patient Dashboard](Images/patient_dashboard.png)
2.  **Symptom Checker:** Interactive survey to identify potential conditions.
    ![Symptom Checker](Images/symptom_checker.png)
3.  **X-Ray Analysis:** AI detecting medical issues (Fracture/TB) from uploaded scans.
    ![X-Ray Analysis](Images/xray_result.png)
4.  **Pharmacy:** Ordering medicines directly from digital prescriptions.
    ![Pharmacy View](Images/pharmacy_view.png)

### Doctor Dashboard
Comprehensive view of patient appointments, shared reports, and analytics.
![Doctor Dashboard](Images/doctor_dashboard.png)

### Features & Utilities
1.  **Voice Navigation:** Hands-free control for accessibility.
    ![Voice Command](Images/voice_nav.png)
2.  **Report Chat (RAG):** AI summarizing medical documents.
    ![Report Chat](Images/report_chat.png)

##  Tech Stack

-   **Frontend:** React, Vite, Tailwind CSS, Lucide React
-   **Backend:** FastAPI (Python), Uvicorn
-   **AI/ML:** XGBoost, Scikit-Learn, PyPDF2
-   **LLM:** Ollama (Mistral 7B Instruct)
-   **Database:** Prisma ORM, SQLite/PostgreSQL
-   **Tools:** Web Speech API, Confetti.js

## Getting Started

### Prerequisites

1.  **Node.js (v18+)**
2.  **Python 3.10+**
3.  **Git**
4.  **Ollama** installed and running locally.
    -   Download from [ollama.com](https://ollama.com).
    -   Pull the required model:
        ```bash
        ollama pull mistral:7b-instruct
        ```

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/gautam-chitti/WeCare
    cd WeCare
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # Mac/Linux
    source .venv/bin/activate
    
    pip install -r requirements.txt
    prisma generate
    prisma db push
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

1.  **Start the Backend:**
    ```bash
    # In /backend
    uvicorn main:app --reload
    ```

2.  **Start the Frontend:**
    ```bash
    # In /frontend
    npm run dev
    ```

3.  **Access the App:**
    Open your browser at `http://localhost:5173`.

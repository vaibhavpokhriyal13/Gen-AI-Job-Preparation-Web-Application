# 🚀 PrepAi

### **AI-Powered Job Interview Preparation Platform**

🔗 **Live Frontend URL**: [gen-ai-job-preparation-web-applic-eta.vercel.app](https://gen-ai-job-preparation-web-applic-eta.vercel.app/)


🔗 **Backend Service URL**: [gen-ai-job-preparation-web-application-5rhs.onrender.com](https://gen-ai-job-preparation-web-application-5rhs.onrender.com)


PrepAi is a premium, modern SaaS web application designed to help job candidates prepare for technical and behavioral interviews. By analyzing a target job description alongside a candidate's resume (PDF) or self-description, PrepAi generates a custom preparation strategy, curated interview questions, a skill gap analysis, and a structured 7-day study roadmap.

---

## ✨ Key Features

### 🔐 Interactive Authentication UI
* **Desktop Split-Screen Layout**: 50/50 division featuring a form panel on the left and a floating vector SVG dashboard mock-up on the right (hidden on mobile).
* **Password Utility Toggles**: Built-in triggers to easily show or hide passwords during entry.
* **Real-time Password Strength Meter**: Interactive, color-coded score indicator bar assessing password complexity dynamically.

### 🧠 AI Strategy & Question Generator
* **Job Matching**: Instant percentage calculation of how well your profile aligns with target job listings.
* **Interactive SVG Circular Progress**: Visual circular ring that dynamically animates from 0% on mount to your score.
* **Curated Question Banks**: Separated accordions for role-specific Technical Questions and STAR-method Behavioral Questions, including interviewer intentions and recommended sample answers.
* **7-Day Roadmap**: A comprehensive day-by-day checklist designed to cover target domain skills.

### 📄 Professional Resume PDF Export
* **One-Click Export**: Converts your interview plan parameters into a professionally styled, printable resume PDF.
* **Asynchronous PDF Renderer**: Built with step-by-step progress loaders, preventing Render server timeout issues.

### 🛡️ Production-Grade Security
* **Input Validation Filters**: Smart validation checks prevent keyboard mashing, blank spaces, or gibberish input, responding with context-aware API alerts.
* **NoSQL Injection Blockers**: Sanitizes query, body, and parameter keys recursively to delete unauthorized operators.
* **Helmet Secure Headers**: Implements XSS protection, MIME-sniffing blocks, and clickjacking preventions.
* **Express Rate Limiting**: Global request limiting (150 requests per 15 mins) and strict auth endpoint limiters (30 requests per 15 mins) protect backend database nodes from DDoS scripts.

---

## 🛠️ Technology Stack

### **Frontend**
* **React 19** & **Vite** (Next-Gen frontend tooling)
* **React Router** (Client-side routing)
* **Sass (SCSS)** (Structured stylesheets & transitions)
* **Axios** (HTTP client with interceptors)

### **Backend**
* **Node.js** & **Express** (REST API architecture)
* **MongoDB** & **Mongoose** (Database modeling)
* **Google GenAI SDK** (Gemini 3 Flash models)
* **Puppeteer** (Chromium headless PDF renderer)

---

## 🚀 Setup & Installation

### **Prerequisites**
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas cluster)

---

### **1. Clone & Project Directory**
```bash
git clone https://github.com/vaibhavpokhriyal13/Gen-AI-Job-Preparation-Web-Application.git
cd Gen-AI-Job-Preparation-Web-Application
```

---

### **2. Backend Configuration**
1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Create a `.env` configuration file:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/prepai
   JWT_SECRET=your_jwt_signing_key_secret
   GOOGLE_GENAI_API_KEY=your_gemini_api_key
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

### **3. Frontend Configuration**
1. Navigate to the `Frontend` directory:
   ```bash
   cd ../Frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Create a `.env` configuration file:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Run locally:
   ```bash
   npm run dev
   ```

---

## 📂 Project Architecture

```text
├── Backend/
│   ├── src/
│   │   ├── controllers/      # API controller callbacks
│   │   ├── middlewares/      # JWT protection, file-upload & sanitizers
│   │   ├── models/           # Mongoose Database Schemas
│   │   ├── routes/           # Router endpoints (Auth, Interview)
│   │   ├── services/         # Gemini AI & Puppeteer PDF compilation
│   │   └── app.js            # Express server initialization
│   └── package.json
│
├── Frontend/
│   ├── public/               # Favicon & assets
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/         # Login, Register pages, contexts, hooks & styles
│   │   │   └── interview/    # Home Dashboard, Workspace layout, API adapters & styles
│   │   ├── components/       # Shared UI components
│   │   ├── main.jsx          # Entry point
│   │   └── index.html        # Root index template
│   └── package.json
```

---

## ⚡ Render Free Tier Warm-up Note
This project is built to handle Render's free tier limitations gracefully:
* **Boot spin-up notice**: The client app automatically triggers server waking on mount. If the server is in sleep mode, a friendly wake-up banner guides the user through the 40-50 second boot time.
* **Keep-Alive Recommendation**: Configure a free cron checker at [cron-job.org](https://cron-job.org/) pointing to `https://your-backend.onrender.com/api/auth/me` every 14 minutes to bypass sleep modes and keep loading speeds instant!

---

## 📄 License
This project is open-source. Feel free to clone, edit, or submit pull requests.

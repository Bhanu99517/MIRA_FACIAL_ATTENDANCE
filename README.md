# MIRA Facial Attendance 🟣

**MIRA ATTENDANCE** is a web-based facial recognition attendance platform designed for diploma / polytechnic institutes.  
Students can check their **attendance, exam results, and application status**, while admins manage everything through a role-based dashboard.

🌐 **Live Demo:** https://miraattendance.vercel.app  

---

## ✨ Key Features

- 👤 **Face Recognition Attendance**
  - Register a reference face for each student
  - Verify the face before marking attendance
  - Prevents proxy / fake attendance

- 🏫 **Role-Based Access Control**
  - **Super Admin** – manages principals and global settings  
  - **Principals / Admins** – manage HODs & faculty  
  - **HODs & Faculty** – manage staff & students, mark/view attendance  
  - **Staff & Students** – limited views and actions

- 📊 **Student Portal (No Login for Students)**
  - View attendance status
  - View exam results
  - Track application status (bonafide, leave, certificates, etc.)
  - See app user guide & basic info

- 📍 **Smart Attendance Rules**
  - (Planned) Geofencing support using device location
  - Time-based & session-based attendance

- 🤖 **AI-Assisted Workflows (Experimental)**
  - Uses a GenAI client to help generate:
    - Notices / circulars
    - Lesson plans / questions
    - Simple content for admin use

- 🧾 **Reports & Logs**
  - Day-wise / month-wise attendance
  - Branch, year, and section wise views
  - Export-friendly data model

---

## 🏗️ Tech Stack

**Frontend**

- React + TypeScript + Vite
- Component-based UI with reusable layout & dashboard components
- Fetch layer in `services.ts` to talk to backend API

**Backend**

- Node.js / Express REST API (in `/backend`)
- Prisma ORM (see `/prisma`)
- JWT / session-based auth (role-aware endpoints)
- Connects to a database via Prisma (MongoDB / SQL configurable)

**Other**

- MIT License
- Deployed on **Vercel** for frontend

---

## 📂 Project Structure

```bash
MIRA_FACIAL_ATTENDANCE/
├── backend/           # Node.js / Express API (attendance, users, auth, etc.)
├── components/        # Shared React components
├── img/               # Logos / screenshots
├── prisma/            # Prisma schema & migrations
├── public/            # Static assets
├── src/               # React source (pages, routes, hooks)
│   ├── components/    # UI building blocks
│   ├── App.tsx        # Main app entry
│   ├── index.tsx      # React root
│   ├── services.ts    # Frontend API client
│   ├── types.ts       # Shared TypeScript models
├── geolocation.ts     # Geolocation helpers (for geofencing logic)
├── package.json       # Root scripts & dependencies
└── README.md
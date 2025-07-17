SkillSage – AI-Powered Placement Platform
-----------------------------------------

SkillSage is a full-stack web platform designed to streamline college placements using AI-driven tools. It offers personalized resources, role-based dashboards, and real-time analytics for students, placement officers, and alumni.

Live Demo: https://skillsage.vercel.app

Features:
---------
- Role-Based Login: Separate portals for Students, Placement Officers, and Alumni
- AI Mock Interviews: Integrated with GPT-4 for realistic interview simulations
- Resume Scoring: ATS-friendly resume analysis using Affinda API
- Skill Gap Analysis: Tracks learning gaps and recommends Coursera/Udemy courses
- Job Matching: Real-time listings from Adzuna API based on skills
- Speech-to-Text: Whisper API for converting interviews into text

Tech Stack:
-----------
Frontend      : React.js, Vite, Tailwind CSS  
Backend       : FastAPI  
Database/Auth : Supabase  
AI Services   : GPT-4, Whisper API, Affinda API, Adzuna API  
Deployment    : Vercel

Project Structure:
------------------
skillsage/
├── src/               # React components
├── backend/           # FastAPI backend logic
├── public/            # Static assets
├── supabase/          # Supabase project config
├── tailwind.config.ts
├── vite.config.ts
└── README.txt

Setup Instructions:
-------------------
Frontend:
1. git clone https://github.com/GaurangKhanderay/skillsage.git
2. cd skillsage
3. npm install
4. npm run dev

Backend:
1. cd backend
2. pip install -r requirements.txt
3. uvicorn main:app --reload

Roadmap:
--------
[x] Frontend role-based UI
[x] Resume scoring integration (Affinda)
[x] AI mock interview (GPT-4)
[ ] Supabase full integration
[ ] Admin dashboard analytics
[ ] Email magic link auth (Supabase)

Acknowledgments:
----------------
OpenAI (GPT-4 & Whisper), Affinda, Adzuna, Supabase, Vercel

Author:
-------
Gaurang Khanderay - linkedin.com/in/gaurang-khanderay

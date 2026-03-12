# 🎯 CodeZapra - Gamified Coding Learning Platform

![Status](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Ready-green)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Integrated-orange)

> **A fully-implemented gamified AI-powered coding learning platform with dark theme, AI-generated quizzes, code challenges, and real-time leaderboards**

---

## ⚡ Quick Start (3 Steps)

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
Gemini keys are configured as Supabase Edge Function secrets (server-side only).

### 2. Setup Database
Go to [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor:
1. **Create Admin Auth User**: Authentication → Users → Add User
   - Email: `admin@CodeZapra.com`
   - Password: `admin123`
2. **Run Database Setup**: Copy and execute `supabase/database_setup.sql`
3. **Run Functions & Triggers**: Copy and execute `supabase/database_functions.sql`
4. **Insert Seed Data**: Copy and execute `supabase/seed_data.sql`

### 3. Start Development
```bash
npm install --legacy-peer-deps
npm run dev
# Visit http://localhost:3000
```

---

## 🎯 Features Implemented

### ✅ Complete Application
- **Authentication System**: Email/password login with role-based access (Admin/User)
- **Course Management**: Create courses, modules, and topics with video content
- **AI-Powered Quizzes**: Auto-generated MCQ quizzes using Gemini AI
- **Code Challenges**: Submit algorithms and code solutions with AI verification
- **Gamification**: Points, rankings, XP system, and real-time leaderboard
- **Dark Theme**: Clean, high-contrast UI with subtle accents
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### 🎨 User Interface
- Modern dark theme with cyan/purple neon accents
- 40+ pre-built shadcn/ui components
- Responsive navigation with sidebar
- Dashboard with stats and progress tracking
- Interactive course catalog and learning paths

### 🤖 AI Integration
- **Round-robin load balancing** across 4 Gemini API keys
- Auto-generated multiple choice questions
- Algorithm and code verification
- Intelligent problem difficulty scaling
- Natural language explanations

### 🔐 Security
- Row Level Security (RLS) policies on all tables
- Secure authentication with Supabase Auth
- API key rotation system
- Protected admin routes

### 📊 Database Schema
- **9 Tables**: Users, Courses, Modules, Topics, Quizzes, Problems, Solutions, Leaderboard, Registrations
- **20+ RLS Policies** for fine-grained access control
- **13 Indexes** for optimal query performance
- Comprehensive relationships and constraints

---

## 🏗️ Architecture

```
Next.js 16 (App Router + TypeScript)
    ↓
Supabase SDK (Database + Auth)
    ↓
[Database] [Auth] [Edge Functions]
    ↓         ↓        ↓
  SQL     Session   Gemini AI
```

---

## 📚 Database Schema (9 Tables)

| Table | Purpose |
    ↓
Google Gemini AI (4 Keys with Round-Robin)
    ↓
PostgreSQL (Supabase)
```

---

## 📂 Project Structure

```
CodeZapra/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── login/             # Authentication
│   ├── courses/           # Course catalog & details
│   ├── learn/             # Learning interface
│   ├── problems/          # Code challenges
│   ├── leaderboard/       # Rankings
│   ├── profile/           # User profile
│   └── admin/             # Admin dashboard
├── components/            # React components
│   ├── ui/                # shadcn/ui components (40+)
│   └── theme-provider.tsx # Dark theme provider
├── lib/                   # Backend utilities
│   ├── supabase.ts        # Database client
│   ├── auth.ts            # Authentication
│   ├── courses.ts         # Course management
│   ├── quiz.ts            # Quiz generation
│   ├── problems.ts        # Problem handling
│   ├── leaderboard.ts     # Ranking system
│   └── utils.ts           # Helper functions
├── hooks/                 # Custom React hooks
├── styles/                # Additional styles
├── supabase/              # Database setup
│   └── database_setup.sql # Complete schema & policies
├── .env.example           # Environment template
├── .env.local             # Your credentials (not in git)
└── README.md              # This file
```

---

## 🎮 User Journey

```
1. Sign Up / Login
   ↓
2. Browse Courses
   ↓
3. Enroll in Course
   ↓
4. Watch Video Lessons
   ↓
5. Take AI Quizzes (must pass to continue)
   ↓
6. Solve Code Problems (3 per topic)
   ↓
7. Earn Points & XP
   ↓
8. Climb Leaderboard
```

---

## 🧭 Top Navigation (Authenticated)

### Student Navbar
- `/dashboard` → HOME
- `/courses` → GATES
- `/my-courses` → MY QUESTS
- `/practice` → PRACTICE
- `/leaderboard` → RANKINGS

### Admin Navbar
- `/dashboard` → HOME
- `/admin/dashboard` → ADMIN
- `/admin/create-course` → CREATE
- `/admin/courses` → CONSOLE
- `/courses` → GATES
- `/practice` → PRACTICE
- `/leaderboard` → RANKINGS

---

## 💰 Points & Rewards

| Achievement | Points |
|-------------|--------|
| Easy Problem | 100 pts |
| Medium Problem | 200 pts |
| Hard Problem | 300 pts |
| Course Completion | 500 pts (default) |

**Note:** Quizzes must be passed (70%+) and now award points/XP via the quiz pass reward.

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles & statistics |
| `courses` | Admin-created courses |
| `modules` | Course sections/chapters |
| `topics` | Individual lessons with videos |
| `user_courses` | User course enrollments |
| `quiz_responses` | Quiz attempts & scores |
| `coding_problems` | AI-generated coding challenges |
| `problem_solutions` | User submissions & verification |
| `leaderboard` | Global rankings by points |

---

## 👥 User Roles

### 👤 User (Student)
- Browse and enroll in courses
- Watch video tutorials
- Complete AI-generated quizzes
- Solve coding problems
- Track progress and rankings
- Edit profile & avatar

### 👨‍💼 Admin (Instructor)
- Create and manage courses
- Add modules and topics
- Configure quiz/problem counts
- Set completion rewards
- Manage course content
- Access admin dashboard

---

## 🔐 Security Features

✅ **Row Level Security (RLS)** - Fine-grained access control  
✅ **Role-based permissions** - Admin vs User separation  
✅ **User data isolation** - Users only see their own data  
✅ **Secure authentication** - Supabase Auth with JWT  
✅ **API key rotation** - 4 Gemini keys with load balancing  
✅ **Environment variables** - Sensitive data outside code  

---

## 🛠️ Tech Stack Details

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js | 16 |
| Language | TypeScript | 5.0 |
| Styling | Tailwind CSS | 3.4 |
| UI Components | shadcn/ui | Latest |
| Database | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | Latest |
| AI | Google Gemini | 1.5 Flash |
| Forms | React Hook Form + Zod | Latest |
| Icons | Lucide React | Latest |

---

## 🚀 Deployment

### Prerequisites
- Supabase account (free tier works)
- Google AI API key (free tier works)
- Vercel/Netlify account (optional)

### Production Checklist
- [ ] Change default admin password
- [ ] Add real Gemini API keys
- [ ] Set up custom domain (optional)
- [ ] Configure environment variables
- [ ] Enable production optimizations
- [ ] Test all features thoroughly
- [ ] Set up error monitoring (optional)

### Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel deploy
```

---

## 📱 Features Overview

### 🎓 Learning Features
- **Video Lessons**: Embedded YouTube/external videos
- **AI Quizzes**: Auto-generated MCQs with explanations
- **Code Challenges**: LeetCode-style problems with test cases
- **Progress Tracking**: Visual progress bars and completion status
- **Smart Unlocking**: Sequential content unlocking

### 🏆 Gamification
- **Points System**: Earn points for solving problems
- **Real-time Leaderboard**: See rankings update live
- **XP & Levels**: Track experience and achievements
- **Badges**: Unlock badges for milestones (future)
- **Streaks**: Daily learning streaks (future)

### 🤖 AI-Powered
- **Quiz Generation**: Contextual MCQs based on topic
- **Problem Creation**: Coding challenges with difficulty levels
- **Algorithm Verification**: Check algorithm explanations
- **Code Testing**: Automated code verification

---

## 🎨 UI/UX Features

- 🌙 **Dark theme** with neon accents (cyan/purple)
- 📱 **Fully responsive** mobile-first design
- ⚡ **Fast navigation** with App Router
- 🎯 **Intuitive interface** with clear CTAs
- 📊 **Data visualization** for stats and progress
- ✨ **Smooth animations** and transitions
- 🔔 **Toast notifications** for user feedback

---

## 🆘 Troubleshooting

### Common Issues

**Database connection error:**
- Verify Supabase URL and anon key in `.env.local`
- Check if database setup SQL was executed
- Ensure project is not paused in Supabase dashboard

**AI features not working:**
- Add Gemini API keys to `.env.local`
- Verify API keys are valid and have quota
- Check browser console for error messages

**Build errors:**
- Run `npm install --legacy-peer-deps`
- Clear `.next` folder and rebuild
- Check Node.js version (18+ required)

**Authentication issues:**
- Verify admin user was created in Supabase Auth
- Check RLS policies are enabled
- Clear browser cache and cookies

---

## 📈 Future Enhancements

- [ ] Real-time collaboration features
- [ ] Code execution sandbox
- [ ] Discussion forums per course
- [ ] Achievement badges system
- [ ] Daily challenges
- [ ] Learning streaks
- [ ] Course recommendations
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Offline mode

---

## 📝 Contributing

This project is complete and ready for use. If you'd like to extend it:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is open source and available for educational purposes.

---

## 🎉 Ready to Start?

### For First-Time Setup:
1. **Copy environment template**: `cp .env.example .env.local`
2. **Add your credentials** to `.env.local`
3. **Setup database**: Run `supabase/database_setup.sql` in Supabase SQL Editor
4. **Install dependencies**: `npm install --legacy-peer-deps`
5. **Start dev server**: `npm run dev`
6. **Login as admin**: `admin@CodeZapra.com` / `admin123`

### For Development:
- Create courses in admin dashboard
- Add modules and topics with videos
- Configure quiz and problem counts
- Test the learning flow as a user
- Monitor leaderboard updates

---

## 📞 Support

For questions or issues:
- Check the troubleshooting section above
- Review [Supabase Documentation](https://supabase.com/docs)
- Review [Next.js Documentation](https://nextjs.org/docs)
- Check [Gemini AI Documentation](https://ai.google.dev/)

---

**Built with ❤️ using Next.js, Supabase, and AI**

**Status:** ✅ Fully Implemented | 🚀 Ready to Deploy

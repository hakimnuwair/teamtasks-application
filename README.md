# TeamTasks — Frontend

![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Vite](https://img.shields.io/badge/Vite-7-646CFF)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4)

A modern, full-stack team productivity SPA — task and sub-task management, group collaboration, real-time updates, and AI-assisted planning, built with React 19 and TypeScript.

**Live Demo →** [teamtasks-application.vercel.app](https://teamtasks-application.vercel.app/) &nbsp;|&nbsp; **Backend Repo →** [teamtasks-backend](https://github.com/hakimnuwair/teamtasks-backend)

---

## Table of Contents

- [What is TeamTasks?](#what-is-teamtasks)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Engineering Highlights](#engineering-highlights)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Related Repositories](#related-repositories)
- [Author](#author)

---

## What is TeamTasks?

TeamTasks helps teams organize work, assign ownership, and track progress in real time — with AI available to help draft a plan when a task needs breaking down. A public landing page introduces the product before sign-up; everything else lives behind authentication.

This repo is the React + TypeScript frontend, covering all UI, client state, and real-time communication with the backend.

---

## Tech Stack

| Layer            | Technology            |
| ----------------- | ---------------------- |
| Framework         | React 19 + TypeScript   |
| Build Tool        | Vite 7                 |
| Styling           | Tailwind CSS v4         |
| State Management  | Zustand                |
| Routing           | React Router v7         |
| Forms             | React Hook Form + Zod   |
| Real-time         | Socket.io Client        |
| HTTP Client       | Axios                  |
| Icons             | Lucide React            |
| Notifications     | React Hot Toast         |

---

## Key Features

- **Authentication** — Email/password and Google OAuth, with password recovery.
- **Groups & Roles** — Create groups, invite members, and manage admin/member permissions.
- **Tasks & Sub-Tasks** — Organize work into tasks and sub-tasks with due dates, priorities, and assignees.
- **AI-Assisted Planning** — Generate a draft sub-task breakdown with Gemini, reviewed before anything is saved.
- **Real-time Collaboration** — Live task and notification updates via Socket.io.
- **Notifications & Activity Log** — Stay on top of assignments, due dates, and team activity.
- **Analytics Dashboard** — Visual overview of task progress, completion rates, and recent activity.
- **Dark / Light Mode** — Persisted theme preference across the app.
- **Responsive Design** — Built mobile-first, from small phones to desktop.

---

## Engineering Highlights

- **Clean, layered architecture** — pages call hooks, hooks manage state via Zustand and delegate to service modules; no component talks to the API directly.
- **Security enforced server-side, reflected in the UI** — permissions and business rules live in the backend; the frontend mirrors them for UX, never as the source of truth.
- **Real-time and AI integration done right** — Socket.io for live updates, Gemini for AI planning with a human-in-the-loop review step before anything persists.
- **Type-safe throughout** — TypeScript end to end with strict linting and no implicit `any`.

---

## Project Structure

```
src/
├── components/     # Shared UI primitives, modals, and feature components
├── config/         # Axios instance, Socket.io client, route constants
├── hooks/          # Custom hooks, one per feature domain
├── layouts/        # App shell and auth page layouts
├── lib/            # Form validation schemas
├── pages/          # Route-level pages (landing, auth, dashboard, groups, tasks, activity, profile)
├── services/       # API service functions, one module per resource
├── store/          # Zustand global state
├── types/          # Shared TypeScript types
└── utils/          # Helper utilities
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- [teamtasks-backend](https://github.com/hakimnuwair/teamtasks-backend) running locally (or a deployed instance to point at)

### Installation

```bash
git clone https://github.com/hakimnuwair/teamtasks-application.git
cd teamtasks-application
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_SOCKET_URL=http://localhost:5001
```

### Running Locally

```bash
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
```

The app runs at `http://localhost:5173` by default.

---

## Scripts

| Command           | Description                        |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the Vite dev server            |
| `npm run build`    | Type-check and build                 |
| `npm run lint`     | Run ESLint                           |
| `npm run preview`  | Preview the production build locally |

---

## Deployment

Deployed on **Vercel**, with automatic deployment on every push to `main`.

To deploy your own instance:

1. Push the repo to GitHub.
2. Import it in [Vercel](https://vercel.com).
3. Add the environment variables from the section above.
4. Deploy.

---

## Related Repositories

- **Backend API** — [teamtasks-backend](https://github.com/hakimnuwair/teamtasks-backend) (Node.js / Express / MongoDB / Socket.io / Gemini)

---

## Author

**Nuwair Hakim** — Full-Stack Developer

[LinkedIn](https://linkedin.com/in/hakimnuwair) · [GitHub](https://github.com/hakimnuwair) · [Portfolio](https://nuwairportfolio.vercel.app)

# TeamTasks — Frontend

A fully responsive team productivity SPA built with React + TypeScript. Features real-time notifications, role-based dashboards, task boards, analytics, dark/light mode, and activity logs.

**Live Demo →** [teamtasks-application.vercel.app](https://teamtasks-application.vercel.app/) &nbsp;|&nbsp; **Backend Repo →** [teamtasks-backend](https://github.com/hakimnuwair/teamtasks-backend)

---

## What is TeamTasks?

Managing tasks across a team is messy — deadlines get missed, accountability is unclear, and updates scatter across chat threads. TeamTasks solves this by giving teams a single place to assign work, track progress, and stay in sync in real time.

**The core problem it solves:** Teams need shared visibility into who is doing what and by when — without relying on chasing people over messages. TeamTasks provides role-based dashboards so each member sees exactly what's relevant to them, a task board to track status at a glance, and real-time Socket.io notifications so nobody misses a deadline or update.

Built as a full MERN stack SPA, this repo is the React + TypeScript frontend — handling all UI, routing, state, and real-time communication with the backend.

---

## Tech Stack

| Layer            | Technology            |
| ---------------- | --------------------- |
| Framework        | React 19 + TypeScript |
| Build Tool       | Vite 7                |
| Styling          | Tailwind CSS v4       |
| State Management | Zustand               |
| Routing          | React Router v7       |
| Forms            | React Hook Form + Zod |
| Real-time        | Socket.io Client      |
| HTTP Client      | Axios                 |
| Icons            | Lucide React          |
| Notifications    | React Hot Toast       |

---

## Features

- **Role-Based Dashboards** — distinct views for Admin, Manager, and Member roles
- **Task Boards** — assign, track, and update tasks with status columns
- **Real-time Updates** — instant notifications and deadline alerts via Socket.io
- **Analytics Dashboard** — visual activity summaries and productivity metrics
- **Activity Logs** — full audit trail of team actions
- **Dark / Light Mode** — persisted theme preference
- **Group Management** — create groups, invite members via invitation flow
- **Reminders** — set and receive task reminders
- **Google OAuth** — sign in with Google alongside JWT auth

---

## Project Structure

```
src/
├── components/
│   ├── common/        # Shared UI components
│   ├── modal/         # Modal components
│   ├── reminders/     # Reminder-specific components
│   └── ui/            # Base UI primitives
├── hooks/             # Custom React hooks
├── layouts/           # Page layout wrappers
├── lib/               # Utility libraries (axios instance, socket)
├── pages/
│   ├── auth/          # Login / Register
│   ├── dashboard/     # Main dashboard
│   ├── groups/        # Group management
│   ├── notifications/ # Notification centre
│   ├── profile/       # User profile
│   ├── reminders/     # Reminders view
│   └── activity/      # Activity logs
├── services/          # API service functions
├── store/             # Zustand global state
├── types/             # TypeScript type definitions
└── utils/             # Helper utilities
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- [teamtasks-backend](https://github.com/hakimnuwair/teamtasks-backend) running locally

### Installation

```bash
# Clone the repo
git clone https://github.com/hakimnuwair/teamtasks-application.git
cd teamtasks-application

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
VITE_SOCKET_URL=http://localhost:5001
VITE_APP_NAME=TeamTasks
VITE_APP_ENV=development
```

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`.

---

## Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start Vite dev server             |
| `npm run build`   | Type-check + build for production |
| `npm run lint`    | Run ESLint                        |
| `npm run preview` | Preview production build locally  |

---

## Deployment

This project is deployed on **Vercel** with CI/CD connected to the main branch. Every push to `main` triggers an automatic deployment.

To deploy your own instance:

1. Push the repo to GitHub
2. Import it in [Vercel](https://vercel.com)
3. Add the environment variables from the `.env` section above
4. Deploy

---

## Related Repositories

- **Backend API** — [teamtasks-backend](https://github.com/hakimnuwair/teamtasks-backend) (Node.js / Express / MongoDB / Socket.io)

---

## Author

**Nuwair Hakim** — Full-Stack Developer

[LinkedIn](https://linkedin.com/in/hakimnuwair) · [GitHub](https://github.com/hakimnuwair) · [Portfolio](https://nuwairportfolio.vercel.app)

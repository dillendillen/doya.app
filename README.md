# 🐕 DOYA Training Platform

> A comprehensive SaaS platform for professional dog trainers to manage clients, sessions, billing, and training programs.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.17-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-316192?logo=postgresql)](https://www.postgresql.org/)

---

## 📋 Overview

DOYA Training Platform is a modern, all-in-one solution designed specifically for dog trainers. It streamlines operations by providing a unified dashboard for managing clients, dogs, training sessions, billing, packages, and more. Built with scalability and multi-tenancy in mind, each trainer has their own isolated workspace.

### Key Features

- 🎯 **Client & Dog Management** - Comprehensive CRM for owners and their dogs
- 📅 **Session Scheduling** - Plan, track, and record training sessions with detailed notes
- 💰 **Billing & Payments** - Invoicing, payment tracking, and package management
- 📦 **Package System** - Create templates and client-specific training packages
- 📊 **Revenue Analytics** - Track income, outstanding payments, and financial overview
- 📝 **Training Plans** - Structure goals, milestones, and progress tracking
- 📸 **Media Library** - Organize photos and videos by dog, session, or tags
- 📄 **Document Management** - Store and manage waivers, intake forms, and training plans
- 🔐 **Multi-Tenant Architecture** - Secure, isolated data per user
- 🌙 **Dark Mode** - Beautiful UI with light/dark theme support

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Docker (optional, for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doya-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/doya"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3002"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3002](http://localhost:3002)

---

## 🏗️ Tech Stack

### Core
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)

### UI & Styling
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/) + Custom components
- **Icons**: [Heroicons](https://heroicons.com/)
- **Charts**: [Recharts](https://recharts.org/)

### Additional Libraries
- **Validation**: [Zod](https://zod.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **State Management**: [TanStack Query](https://tanstack.com/query)

---

## 📁 Project Structure

```
doya-app/
├── app/
│   ├── (app)/          # Protected application routes
│   │   ├── clients/    # Client management
│   │   ├── dogs/       # Dog profiles
│   │   ├── sessions/   # Training sessions
│   │   ├── billing/    # Billing & payments
│   │   ├── packages/   # Package management
│   │   └── ...
│   ├── (auth)/         # Authentication routes
│   │   └── login/      # Login page
│   ├── api/            # API routes
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── auth/           # Authentication components
│   ├── billing/        # Billing components
│   ├── clients/        # Client components
│   └── ...
├── lib/
│   ├── auth/           # Authentication utilities
│   ├── data/           # Data access layer
│   └── prisma.ts       # Prisma client
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

---

## 🔐 Authentication

The platform uses session-based authentication with secure password hashing. Each user has their own isolated workspace with complete data separation.

### User Registration

Currently, user registration can be done through:
- Admin-created accounts
- Self-registration (if enabled)

### Security Features

- Password hashing with bcrypt
- HTTP-only session cookies
- Route protection middleware
- Multi-tenant data isolation

---

## 📊 Database Schema

Key models include:
- **User** - Trainer accounts
- **Client** - Dog owners
- **Dog** - Individual dogs
- **Session** - Training sessions
- **Package** - Training packages (templates & client-specific)
- **Payment** - Payment records
- **Invoice** - Invoices linked to payments
- **TrainingPlan** - Structured training plans
- **Document** - Stored documents
- **Media** - Photos and videos

All tenant-scoped models include a `userId` field for data isolation.

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server (port 3002)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Database Commands

```bash
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev     # Create and apply migration
npx prisma generate        # Regenerate Prisma Client
npx prisma db push         # Push schema changes (dev only)
```

---

## 🎨 Features in Detail

### Dashboard
- Today's sessions overview
- Action queue for pending tasks
- Quick capture for common actions
- KPI tiles (revenue, bookings, etc.)
- Recent activity feed

### Sessions
- Create and manage training sessions
- Timer functionality for live sessions
- Structured notes with objectives
- Package assignment and credit tracking
- Media attachments

### Billing
- Invoice generation
- Payment recording and tracking
- Package management
- Revenue overview with charts
- Outstanding balance tracking

### Clients & Dogs
- Comprehensive profiles
- Training plan management
- Session history
- Document storage
- Media galleries

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is private and proprietary.

---

## 🆘 Support

For issues, questions, or feature requests, please open an issue in the repository.

---

**Built with ❤️ for dog trainers**

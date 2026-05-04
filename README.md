# Cross-border E-commerce AI SaaS Platform
# 跨境电商 AI SaaS 合规与运营平台

## Project Overview

A comprehensive AI-powered platform tailored for cross-border e-commerce sellers. It provides advanced compliance and operational tools to protect and group businesses efficiently. 

Key functionalities include:
- **AI Compliance Consulting**: Intelligent policy interpretation and guidance.
- **Trademark Risk Radar**: Early detection of trademark infringements.
- **Patent Risk Radar**: Comprehensive patent conflict analysis.
- **Graphic Infringement Identification**: Multi-modal AI to detect design and visual violations.
- **Platform Policy Consulting**: Real-time cross-platform (Amazon, eBay, TikTok, etc.) compliance alerts.
- **Subscription Management**: Automated SAAS plans (Free, Startup, Pro) and billing operations.
- **Administrator Panel**: Complete oversight for orders, users, and AI interaction histories.
- **User Dashboard**: Personalized compliance reports and account management.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend/API**: Express (embedded in Vite development flow via SSR / Middleware)
- **Database**: PostgreSQL with Prisma ORM
- **AI/LLM**: Google GenAI SDK (Gemini)

## Local Development

Ensure you have Node.js and npm installed.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Add your `DATABASE_URL` and `GEMINI_API_KEY`.

3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

Check `.env.example` for the required configuration formats:
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `JWT_SECRET`

## License
MIT License

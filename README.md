# SailGuard AI - 鹭起南洋
## Cross-border E-commerce AI SaaS Platform

## Project Overview

A comprehensive AI-powered platform tailored for cross-border e-commerce sellers. It provides advanced compliance and operational tools to protect and group businesses efficiently. 

Key functionalities include:
- **AI Compliance Consulting**: Intelligent policy interpretation and guidance.
- **Trademark Risk Radar**: Early detection of trademark infringements.
- **Graphic Infringement Identification**: Multi-modal AI to detect design and visual violations.
- **Subscription Management**: Automated SAAS plans (Free, Startup, Pro) and billing operations.
- **Administrator Panel**: Complete oversight for orders, users, and AI interaction histories.
- **User Dashboard**: Personalized compliance reports and account management.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend/API**: Vercel Serverless Functions
- **Database**: PostgreSQL with Prisma ORM
- **AI/LLM**: Support for OpenAI-compatible and Gemini APIs

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

## Environment Variables / 环境变量说明

For AI configuration, we prefer OpenAI-compatible endpoints. The API Key only runs on Vercel serverless API routes and is never exposed to the browser.

### Preferred (OpenAI-compatible)
- `SAILGUARD_LLM_API_KEY`: Your OpenAI-compatible API key.
- `SAILGUARD_LLM_BASE_URL`: API Base URL (e.g., `https://max.openai365.top/v1`).
- `SAILGUARD_LLM_MODEL`: Primary model to use (e.g., `gemini-3.1-pro-preview`).
- `SAILGUARD_LLM_FALLBACK_MODELS`: Comma-separated list of fallback models.

### Also supported for compatibility
- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `LLM_FALLBACK_MODEL`

### Gemini Official Fallback
If OpenAI-compatible keys are not set, it will fallback to official Gemini SDK:
- `GEMINI_API_KEY`
- `GOOGLE_AI_API_KEY`
- `API_KEY`

Check your configuration status by visiting `/api/health`.

### Other required variables:
- `DATABASE_URL` / `DIRECT_URL`
- `JWT_SECRET`
- `BLOB_READ_WRITE_TOKEN`

## License
MIT License

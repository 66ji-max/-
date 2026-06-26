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

Check your configuration status by visiting `/api/auth?action=health`.

### Other required variables:
- `POSTGRES_PRISMA_URL` (for Neon database)
- `POSTGRES_URL_NON_POOLING`
- `JWT_SECRET`
- `BLOB_READ_WRITE_TOKEN`

## Database Diagnostics

If you encounter missing table errors during file upload or admin usage, you can check which tables exist in your Neon SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'User',
  'Membership',
  'UploadedFile',
  'UsageRecord',
  'UpgradeOrder',
  'AiChatSession',
  'AiChatMessage',
  'ComplianceSource',
  'ComplianceArticle',
  'ComplianceCrawlRun'
)
ORDER BY table_name;
```

如果缺表，执行：
```bash
npx prisma db push
```
或在 Neon SQL Editor 手动创建对应表。

## Compliance Database & Crawler

Run the crawler script manually via GitHub Actions (`Actions` → `Crawl Compliance Sources` → `Run workflow`) or locally via `npm run crawl:compliance`.
The schedule cron job is currently commented out in `.github/workflows/crawl-compliance.yml` pending further stability tests. Once confirmed, you can uncomment it to enable automated daily runs.

**Note**: Please manually execute `npx prisma db push` on your Neon database to apply the new schema changes for `ComplianceSource` and `ComplianceArticle`.

**Crawler Guidelines**:
- 优先使用官方 RSS/API、公开公告、授权来源；
- 遵守 robots.txt 和网站条款；
- 不抓取需要登录、付费、禁止转载的内容；
- 数据库保存标题、摘要、URL、发布时间、来源，不大规模复制版权全文；
- 对重要政策建议人工审核后再发布（爬取数据默认为 `draft` 状态，请在 AdminPanel 手动变更为 `published` 后 AI 才会使用）；
- AI 输出仅作业务参考，不构成正式法律意见。

## License
MIT License

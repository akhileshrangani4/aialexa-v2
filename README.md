# AIAlexa

**Production-ready AI chatbot platform for education**

Create intelligent, context-aware chatbots powered by your course materials using advanced RAG (Retrieval-Augmented Generation).

## ✨ Features

- 🤖 **4 Open-Source AI Models**: Llama 3.3 70B, Mistral Large, Qwen 2.5 72B, GPT-OSS 120B
- 📚 **RAG-Powered**: Upload PDFs, Word docs, and more for context-aware responses
- 👥 **Professor Approval Workflow**: Admin-controlled user registration
- 📊 **Analytics Dashboard**: Track conversations, usage patterns, and popular topics
- 🔒 **Secure & Rate-Limited**: Upstash Redis rate limiting on public endpoints
- ⚡ **Async File Processing**: Background processing with Upstash QStash
- 🎨 **Modern UI**: Shadcn UI components with Tailwind CSS
- 📧 **Email Notifications**: Resend integration for approvals and notifications
- 🌐 **Subdomain Support**: Separate admin dashboard at admin.domain.com

## 🏗️ Tech Stack

### Core

- **Next.js 15** - React framework with App Router
- **Turborepo** - Monorepo build system
- **TypeScript** - Type safety throughout
- **tRPC** - End-to-end type-safe APIs
- **Tailwind CSS** - Utility-first styling

### Database & Auth

- **PostgreSQL** (Supabase) - Primary database
- **Drizzle ORM** - Type-safe database access
- **pgvector** - Vector similarity search
- **Better Auth** - Authentication with email/password

### AI & RAG

- **OpenRouter** - Unified AI model access
- **Vercel AI SDK** - Streaming & tool calling
- **LangChain** - Text splitting and RAG utilities
- **tiktoken** - Token counting

### Infrastructure

- **Upstash Redis** - Rate limiting
- **Upstash QStash** - Async job processing
- **Supabase Storage** - File storage
- **Resend** - Email delivery
- **Pino** - Structured logging

### UI

- **Shadcn UI** - Component library
- **React Hook Form** - Form management
- **Recharts** - Analytics charts

## 📦 Project Structure

```
aialexa/
├── apps/web/              # Next.js application
│   ├── src/app/          # Pages & API routes
│   ├── src/components/   # UI components
│   ├── src/lib/          # Utilities
│   └── src/server/       # tRPC routers
├── packages/
│   ├── db/               # Database schema
│   └── ai/               # OpenRouter + RAG
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL database (Supabase recommended)
- OpenRouter API key
- OpenAI API key (for embeddings)
- Resend API key
- Upstash Redis + QStash

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create `apps/web/.env` with required variables:

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Better Auth
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000

# AI/OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENAI_API_KEY=sk-your-key  # For embeddings

# Resend
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL=onboarding@yourdomain.com

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Upstash QStash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_EMAIL_DOMAINS=.edu,.ac.in,.edu.in
ADMIN_EMAILS=admin@example.com
MAX_FILE_SIZE_MB=10
```

### 3. Database Setup

Enable pgvector extension in Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Push database schema:

```bash
npm run db:push
```

Create first admin user:

```sql
INSERT INTO "user" (id, email, name, "emailVerified", status, role)
VALUES (gen_random_uuid(), 'admin@example.com', 'Admin', true, 'approved', 'admin');
```

### 4. Start Development Server

```bash
npm run dev
```

Access:

- Main app: http://localhost:3000
- Admin: http://admin.localhost:3000

## 📚 Documentation

**[SETUP.md](./SETUP.md)** - Complete setup guide with all environment variables, database setup, deployment instructions, and troubleshooting

## 🛠️ Development

### Available Scripts

```bash
npm run dev         # Start dev server
npm run build       # Build all packages
npm run lint        # Lint codebase
npm run db:generate # Generate migrations
npm run db:push     # Push schema to database
npm run db:studio   # Open Drizzle Studio
```

### Key Concepts

#### tRPC Routers

All API logic is in `apps/web/src/server/routers/`:

- `auth.ts` - Authentication status
- `chatbot.ts` - Chatbot CRUD
- `chat.ts` - Chat messages with RAG
- `files.ts` - File upload/management
- `analytics.ts` - Usage statistics
- `admin.ts` - User approval & domains

#### Middleware

`src/middleware.ts` handles:

- Subdomain routing (admin.domain.com)
- Authentication checks
- Rate limiting
- User status validation

#### Async Jobs

File processing runs asynchronously via QStash:

- Upload triggers job publication
- `/api/jobs/process-file` handles processing
- Extracts text, generates embeddings, stores in DB

## 🔐 Security

- ✅ Rate limiting on public endpoints
- ✅ Email domain restrictions
- ✅ Admin approval required for new users
- ✅ QStash signature verification
- ✅ Session-based authentication
- ✅ Row-level security ready (Supabase)

## 📊 Implementation Status

### ✅ Complete

- Full tRPC API (auth, chatbot, chat, files, admin, analytics)
- Better Auth with approval workflow
- RAG system with pgvector semantic search
- Async file processing (QStash)
- Rate limiting (Upstash Redis)
- Email notifications (Resend)
- Structured logging (Pino)
- All pages & UI components
- Chat interface with file upload
- Admin dashboard

**Ready for production deployment!**

## 🤝 Contributing

This is a production system. Follow these guidelines:

1. Keep code modular and type-safe
2. Add logging for all important events
3. Write tests for new features
4. Update documentation
5. Follow existing patterns

## 📝 License

See [LICENSE](./LICENSE)

## 🙏 Acknowledgments

Built with:

- [Next.js](https://nextjs.org/)
- [tRPC](https://trpc.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://better-auth.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [OpenRouter](https://openrouter.ai/)
- [Vercel AI SDK](https://sdk.vercel.ai/)

---

**Ready to revolutionize education with AI! 🚀**

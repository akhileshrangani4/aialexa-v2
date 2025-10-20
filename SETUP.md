# AIAlexa - Complete Setup Guide

## 📋 Overview

Production-ready AI chatbot platform built with Next.js 15, tRPC, Better Auth, and OpenRouter. This guide covers complete setup from installation to deployment.

---

## 🚀 Quick Start

### Prerequisites

Create accounts and obtain API keys from:
- **Supabase** (https://supabase.com/) - PostgreSQL + Storage
- **OpenRouter** (https://openrouter.ai/) - AI models
- **Resend** (https://resend.com/) - Email service
- **Upstash** (https://upstash.com/) - Redis + QStash

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `apps/web/.env`:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI/OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-...  # For embeddings

# Better Auth
BETTER_AUTH_SECRET=your_random_32_char_secret  # Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Upstash QStash (Async Jobs)
QSTASH_TOKEN=your_qstash_token
QSTASH_URL=https://qstash.upstash.io
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://[region].upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_FILE_SIZE_MB=10
ADMIN_EMAILS=admin@yourdomain.com
```

### 3. Database Setup

#### Enable pgvector Extension

In Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Run Migrations

```bash
npm run db:push
```

#### Create First Admin User

In Supabase SQL editor:

```sql
INSERT INTO "user" (id, email, name, role, status, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',  -- Change this
  'Admin User',
  'admin',
  'approved',
  true,
  NOW(),
  NOW()
);
```

### 4. Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Create bucket: `chatbot-files`
3. Set as **Private**

### 5. Start Development

```bash
npm run dev
```

Visit: http://localhost:3000

---

## 🏗️ Architecture

### Tech Stack

**Core**: Next.js 15 · TypeScript · Turborepo · tRPC  
**Database**: PostgreSQL (Supabase) · Drizzle ORM · pgvector  
**Auth**: Better Auth with approval workflow  
**AI**: OpenRouter (4 models) · Vercel AI SDK · LangChain  
**Infrastructure**: Upstash Redis · QStash · Resend  
**UI**: Shadcn UI · Tailwind CSS

### Project Structure

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

---

## 🔐 Authentication & Approval

### How It Works

**Registration:**
1. User registers → status set to 'pending'
2. Database hook validates email domain
3. Admin receives notification email
4. User sees "Awaiting approval" message

**Login:**
1. User enters credentials
2. Better Auth validates
3. Database hook checks status
4. Blocks if pending/rejected
5. Allows if approved

**Approval:**
1. Admin views pending users at `/admin`
2. Approves or rejects
3. User receives email notification
4. Approved users can login

### Domain Validation (Optional)

Restrict registration to specific domains:

```sql
INSERT INTO "approved_domains" (domain, created_at)
VALUES 
  ('yourdomain.com', NOW()),
  ('university.edu', NOW());
```

If no domains configured → all emails allowed.

---

## 📁 File Upload & Processing

### Upload Flow

1. User uploads file (PDF, Word, TXT, etc.)
2. File stored in Supabase Storage
3. Metadata saved to database
4. QStash job triggered
5. File extracted and chunked
6. Embeddings generated (OpenAI)
7. Stored in database with pgvector
8. Status updated to 'completed'

### Supported Types

- PDF (pdf-parse)
- Word Documents (mammoth)
- Plain Text
- Markdown
- JSON
- CSV

---

## 💬 Chat & RAG System

### How RAG Works

1. User sends message
2. Generate embedding for query
3. pgvector finds top 5 similar chunks
4. Relevant context injected into prompt
5. OpenRouter generates response
6. Sources cited in metadata

### Configuration

- **Chunk size**: 1000 characters
- **Overlap**: 200 characters
- **Similarity search**: pgvector cosine distance
- **Top K**: 5 chunks
- **Models**: Llama 3.3 70B, Mistral Large, Qwen 2.5 72B, GPT-OSS 120B

---

## 📊 API Reference (tRPC)

### Auth Router
- `getStatus` - Current user status
- `checkApprovalStatus` - Check approval

### Chatbot Router
- `list` - Get user's chatbots
- `create` - Create new chatbot
- `update` - Update settings
- `delete` - Delete chatbot
- `get` - Get chatbot by ID
- `getByShareToken` - Get by share token
- `generateShareToken` - Generate public link

### Chat Router
- `sendMessage` - Send message (protected)
- `sendSharedMessage` - Public chat (rate limited)
- `getHistory` - Conversation history
- `deleteConversation` - Delete session

### Files Router
- `upload` - Upload file
- `list` - List files
- `delete` - Delete file
- `getProcessingStatus` - Check status
- `getPreviewUrl` - Get signed URL

### Admin Router
- `getPendingUsers` - Users awaiting approval
- `approveUser` - Approve user
- `rejectUser` - Reject user
- `addDomain` - Add approved domain
- `removeDomain` - Remove domain
- `listDomains` - List domains

### Analytics Router
- `getChatbotStats` - Aggregate stats
- `getConversations` - Recent sessions
- `getMessageVolume` - Usage charts

---

## 🧪 Testing

### Test Checklist

**Database:**
- [ ] pgvector enabled
- [ ] Migrations successful
- [ ] Admin user created
- [ ] Storage bucket created

**Authentication:**
- [ ] User registration
- [ ] Admin notification email
- [ ] Pending user blocked from login
- [ ] Admin approval works
- [ ] Approved user can login

**Chatbot & Files:**
- [ ] Create chatbot
- [ ] Upload file
- [ ] File processes successfully
- [ ] Embeddings created

**Chat:**
- [ ] Send message with RAG
- [ ] Sources displayed
- [ ] Public chat works
- [ ] Rate limiting active

**Admin:**
- [ ] View pending users
- [ ] Approve/reject users
- [ ] Manage domains

---

## 🚀 Production Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Deploy AIAlexa"
git push origin main
```

### 2. Deploy to Vercel

1. Import GitHub repository
2. Set Root Directory: `apps/web`
3. Add all environment variables
4. Deploy!

### 3. Update Environment Variables

**IMPORTANT** - Change these for production:
- `BETTER_AUTH_URL` → `https://yourdomain.com`
- `NEXT_PUBLIC_APP_URL` → `https://yourdomain.com`
- `RESEND_FROM_EMAIL` → verified domain
- Regenerate `BETTER_AUTH_SECRET`

### 4. Production Database

1. Enable pgvector in production
2. Run migrations
3. Create admin user(s)
4. Create Storage bucket

### 5. Configure Domains

**Main App**: `yourdomain.com`  
**Admin**: `admin.yourdomain.com`

In Vercel:
1. Settings → Domains
2. Add both domains
3. Update DNS records

---

## 🐛 Troubleshooting

### Build Fails
**Error**: Missing environment variables  
**Solution**: Create `apps/web/.env` with all required vars

### Database Migration Fails
**Error**: Cannot connect  
**Solution**: 
1. Check `DATABASE_URL`
2. Enable pgvector
3. Verify database is accessible

### File Upload Fails
**Error**: Upload/processing fails  
**Solution**:
1. Verify Storage bucket exists: `chatbot-files`
2. Check `SUPABASE_SERVICE_ROLE_KEY`
3. Verify QStash credentials

### AI Chat Not Working
**Error**: No response  
**Solution**:
1. Check `OPENROUTER_API_KEY`
2. Check `OPENAI_API_KEY` for embeddings
3. Verify model name in config
4. Check file chunks have embeddings

### Emails Not Sending
**Error**: No emails received  
**Solution**:
1. Verify `RESEND_API_KEY`
2. Check domain is verified in Resend
3. Check spam folder

---

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Database
npm run db:push       # Push schema
npm run db:generate   # Generate migrations
npm run db:studio     # Open Drizzle Studio

# Linting
npm run lint
```

---

## 🎯 Features

### For Instructors
- Create chatbots for each course
- Upload course materials (PDF, Word, etc.)
- Get shareable links for students
- View conversation analytics
- Manage multiple chatbots

### For Students
- Access via shared link (no signup)
- Ask questions about materials
- Get AI-powered answers
- See source citations
- Completely anonymous

### For Admins
- Review user registrations
- Approve/reject users
- Manage email domains
- View system-wide stats

---

## 🔒 Security

- ✅ Rate limiting on public endpoints
- ✅ Admin approval required
- ✅ Email domain restrictions
- ✅ Session-based authentication
- ✅ QStash signature verification
- ✅ Signed URLs for files

---

## 📊 Database Schema

### Core Tables

**user** - User accounts with role/status  
**session** - Better Auth sessions  
**chatbots** - Chatbot configurations  
**chatbot_files** - Uploaded files  
**file_chunks** - Text chunks with embeddings (pgvector)  
**conversations** - Chat sessions  
**messages** - Chat messages  
**analytics** - Usage tracking  
**approved_domains** - Email whitelist

---

## ✨ What's Included

### Backend
- ✅ All 6 tRPC routers implemented
- ✅ Better Auth with database hooks
- ✅ RAG system with semantic search
- ✅ Async file processing
- ✅ Email notifications
- ✅ Rate limiting
- ✅ Structured logging

### Frontend
- ✅ All pages implemented
- ✅ Full chat interface
- ✅ File upload with drag-drop
- ✅ Create chatbot dialog
- ✅ Admin dashboard
- ✅ Public chat sharing

---

## 🎉 You're Ready!

The project is production-ready. Follow the setup steps above, and you'll have a fully functional AI chatbot platform running in minutes.

For support or questions, refer to this guide and the inline code documentation.

**Built with ❤️ using Next.js, tRPC, Better Auth, and OpenRouter**


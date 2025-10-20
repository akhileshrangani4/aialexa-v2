import { router } from '../trpc';
import { authRouter } from './auth';
import { chatbotRouter } from './chatbot';
import { chatRouter } from './chat';
import { filesRouter } from './files';
import { analyticsRouter } from './analytics';
import { adminRouter } from './admin';

export const appRouter = router({
  auth: authRouter,
  chatbot: chatbotRouter,
  chat: chatRouter,
  files: filesRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;


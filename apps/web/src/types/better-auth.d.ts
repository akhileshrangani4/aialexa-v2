import { auth } from '@/lib/auth';

// Infer types from Better Auth configuration
export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];


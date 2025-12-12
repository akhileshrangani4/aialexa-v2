import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { chatbots, user, chatbotFileAssociations } from "@aialexa/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { SUPPORTED_MODELS } from "@aialexa/ai";
import { checkRateLimit, chatbotCreationRateLimit } from "@/lib/rate-limit";

const createChatbotSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(1).max(1000000),
  model: z.enum(SUPPORTED_MODELS),
  temperature: z.number().min(0).max(100).default(70),
  maxTokens: z.number().min(100).max(4000).default(2000),
  welcomeMessage: z.string().max(500).optional(),
  suggestedQuestions: z.array(z.string()).max(5).default([]),
  showSources: z.boolean().optional(),
});

export const chatbotRouter = router({
  /**
   * List user's chatbots
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const offset = input?.offset ?? 0;

      // Get total count
      const [totalCountResult] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(chatbots)
        .where(eq(chatbots.userId, ctx.session.user.id));

      const totalCount = Number(totalCountResult?.count || 0);

      // Get paginated chatbots
      const userChatbots = await ctx.db
        .select()
        .from(chatbots)
        .where(eq(chatbots.userId, ctx.session.user.id))
        .orderBy(desc(chatbots.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        chatbots: userChatbots,
        totalCount,
      };
    }),

  /**
   * Get single chatbot by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.id),
            eq(chatbots.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      return chatbot;
    }),

  /**
   * Get single chatbot by ID (alias for getById)
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.id),
            eq(chatbots.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      return chatbot;
    }),

  /**
   * Get chatbot by share token (public)
   */
  getByShareToken: publicProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ ctx, input }) => {
      const [chatbot] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.shareToken, input.shareToken),
            eq(chatbots.sharingEnabled, true),
          ),
        )
        .limit(1);

      if (!chatbot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found or not shared",
        });
      }

      return chatbot;
    }),

  /**
   * Get featured chatbots (public)
   * Returns up to 4 featured chatbots with creator info and file counts
   */
  getFeatured: publicProcedure.query(async ({ ctx }) => {
    const featuredChatbots = await ctx.db
      .select({
        id: chatbots.id,
        name: chatbots.name,
        description: chatbots.description,
        createdAt: chatbots.createdAt,
        shareToken: chatbots.shareToken,
        customAuthorName: chatbots.customAuthorName,
        userName: user.name,
        userEmail: user.email,
        fileCount: sql<number>`
          (SELECT COUNT(*)::int 
           FROM ${chatbotFileAssociations} 
           WHERE ${chatbotFileAssociations.chatbotId} = ${chatbots.id})
        `,
      })
      .from(chatbots)
      .leftJoin(user, eq(chatbots.userId, user.id))
      .where(eq(chatbots.featured, true))
      .orderBy(desc(chatbots.createdAt))
      .limit(4);

    return featuredChatbots;
  }),

  /**
   * Create new chatbot
   */
  create: protectedProcedure
    .input(createChatbotSchema)
    .mutation(async ({ ctx, input }) => {
      // Rate limiting: 10 chatbots per hour per user
      const { success, reset } = await checkRateLimit(
        chatbotCreationRateLimit,
        ctx.session.user.id,
        {
          userId: ctx.session.user.id,
          endpoint: "chatbotCreation",
        },
      );

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many chatbot creations. Please try again in ${Math.ceil(retryAfter / 3600)} hour(s).`,
        });
      }

      // Generate shareToken automatically since sharing is enabled by default
      const shareToken = nanoid(16);

      const [newChatbot] = await ctx.db
        .insert(chatbots)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          systemPrompt: input.systemPrompt,
          model: input.model,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          welcomeMessage: input.welcomeMessage,
          suggestedQuestions: input.suggestedQuestions,
          shareToken,
          sharingEnabled: true,
        })
        .returning();

      return newChatbot;
    }),

  /**
   * Update chatbot
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: createChatbotSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.id),
            eq(chatbots.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      const [updated] = await ctx.db
        .update(chatbots)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(chatbots.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Delete chatbot
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.id),
            eq(chatbots.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      await ctx.db.delete(chatbots).where(eq(chatbots.id, input.id));

      return { success: true };
    }),

  /**
   * Generate share token for chatbot
   */
  generateShareToken: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.id),
            eq(chatbots.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      // Reuse existing shareToken if it exists, otherwise generate a new one
      const shareToken = existing.shareToken || nanoid(16);

      const [updated] = await ctx.db
        .update(chatbots)
        .set({
          shareToken,
          sharingEnabled: true,
          updatedAt: new Date(),
        })
        .where(eq(chatbots.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      return {
        shareToken: updated.shareToken!,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${updated.shareToken}`,
      };
    }),

  /**
   * Disable sharing for chatbot
   */
  disableSharing: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(chatbots)
        .where(
          and(
            eq(chatbots.id, input.id),
            eq(chatbots.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chatbot not found",
        });
      }

      // Keep shareToken but disable sharing
      await ctx.db
        .update(chatbots)
        .set({ sharingEnabled: false, updatedAt: new Date() })
        .where(eq(chatbots.id, input.id));

      return { success: true };
    }),
});

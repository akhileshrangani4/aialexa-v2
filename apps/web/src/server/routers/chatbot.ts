import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { chatbots } from "@aialexa/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { SUPPORTED_MODELS } from "@aialexa/ai";

const createChatbotSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(1).max(4000),
  model: z.enum(SUPPORTED_MODELS),
  temperature: z.number().min(0).max(100).default(70),
  maxTokens: z.number().min(100).max(4000).default(2000),
  welcomeMessage: z.string().max(500).optional(),
  suggestedQuestions: z.array(z.string()).max(5).default([]),
});

export const chatbotRouter = router({
  /**
   * List user's chatbots
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userChatbots = await ctx.db
      .select()
      .from(chatbots)
      .where(eq(chatbots.userId, ctx.session.user.id))
      .orderBy(chatbots.createdAt);

    return userChatbots;
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
   * Create new chatbot
   */
  create: protectedProcedure
    .input(createChatbotSchema)
    .mutation(async ({ ctx, input }) => {
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

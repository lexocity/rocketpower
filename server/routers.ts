import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Shared Zod Schemas ───────────────────────────────────────────────────────────────
const absenceSchema = z.object({
  coverageDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  staffName: z.string().min(1).max(128),
  timeRange: z.enum(["all_day", "morning", "afternoon", "custom"]).default("all_day"),
  customTimeStart: z.string().max(16).optional().nullable(),
  customTimeEnd: z.string().max(16).optional().nullable(),
  subName: z.string().max(128).optional().nullable(),
  subStatus: z.enum(["assigned", "no_sub", "new_sub", "split"]).default("assigned"),
  isOAM: z.boolean().default(false),
  absenceType: z.enum(["sick", "personal", "educational", "other", "unknown"]).default("unknown"),
  employeeNumber: z.string().max(32).optional().nullable(),
  subNumber: z.string().max(32).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const coverageSchema = z.object({
  coverageDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  coveringStaffName: z.string().min(1).max(128),
  coveringFor: z.string().min(1).max(128),
  location: z.string().max(256).optional().nullable(),
  coverageReason: z.enum(["subbing", "iep", "absent", "class_coverage", "other"]).default("subbing"),
  timeSlot: z.enum(["morning_duty", "lunch_duty", "afternoon_duty", "custom", "all_day"]).default("custom"),
  customTimeStart: z.string().max(16).optional().nullable(),
  customTimeEnd: z.string().max(16).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ─── App Router ───────────────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Coverage Board ─────────────────────────────────────────────────────────────────────
  coverage: router({
    getByDate: publicProcedure
      .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        const [absenceList, coverageList] = await Promise.all([
          db.getAbsencesByDate(input.date),
          db.getCoverageByDate(input.date),
        ]);
        return { absences: absenceList, coverage: coverageList };
      }),
  }),

  // ─── Absences (Admin) ─────────────────────────────────────────────────────────────────────
  absences: router({
    create: protectedProcedure
      .input(absenceSchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        return db.createAbsence({ ...input, createdBy: ctx.user.id });
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: absenceSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        await db.updateAbsence(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        await db.deleteAbsence(input.id);
        return { success: true };
      }),
  }),

  // ─── Coverage Assignments (Admin) ─────────────────────────────────────────────────────────────────────
  assignments: router({
    create: protectedProcedure
      .input(coverageSchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        return db.createCoverage({ ...input, createdBy: ctx.user.id });
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: coverageSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        await db.updateCoverage(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        await db.deleteCoverage(input.id);
        return { success: true };
      }),
  }),

  // ─── Staff / Users ───────────────────────────────────────────────────────────────────────────
  staff: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getAllUsers();
    }),

    pending: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getPendingUsers();
    }),

    approve: protectedProcedure
      .input(z.object({ userId: z.number(), status: z.enum(["approved", "rejected"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        await db.updateAccountStatus(input.userId, input.status);
        return { success: true };
      }),

    setRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    updatePushToken: protectedProcedure
      .input(z.object({ token: z.string().nullable() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserPushToken(ctx.user.id, input.token);
        return { success: true };
      }),
  }),

  // ─── Notifications (Admin) ─────────────────────────────────────────────────────────────────────
  notifications: router({
    send: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(256),
        body: z.string().min(1),
        recipientType: z.enum(["all", "specific"]),
        recipientIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");

        const allUsers = await db.getUsersWithPushTokens();
        let targets = allUsers.filter((u) => u.expoPushToken);

        if (input.recipientType === "specific" && input.recipientIds?.length) {
          targets = targets.filter((u) => input.recipientIds!.includes(u.id));
        }

        const tokens = targets.map((u) => u.expoPushToken!).filter(Boolean);
        let successCount = 0;
        let failureCount = 0;

        if (tokens.length > 0) {
          try {
            const chunks = chunkArray(tokens, 100);
            for (const chunk of chunks) {
              const messages = chunk.map((token) => ({
                to: token,
                title: input.title,
                body: input.body,
                sound: "default",
                data: { type: "duty_change" },
              }));
              const response = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Encoding": "gzip, deflate" },
                body: JSON.stringify(messages),
              });
              if (response.ok) {
                const result = await response.json() as { data: Array<{ status: string }> };
                for (const item of result.data) {
                  if (item.status === "ok") successCount++;
                  else failureCount++;
                }
              } else {
                failureCount += chunk.length;
              }
            }
          } catch (err) {
            console.error("[Notifications] Push send error:", err);
            failureCount = tokens.length;
          }
        }

        const logId = await db.createNotificationLog({
          sentBy: ctx.user.id,
          title: input.title,
          body: input.body,
          recipientType: input.recipientType,
          recipientIds: input.recipientIds ? JSON.stringify(input.recipientIds) : null,
          successCount,
          failureCount,
        });

        // Record per-recipient delivery status
        const recipientRows = targets.map((u) => ({
          userId: u.id,
          delivered: !!u.expoPushToken,
        }));
        // Also include users with no token (so admin can see who wasn't reachable)
        if (input.recipientType === "all") {
          const noTokenUsers = allUsers.filter((u) => !u.expoPushToken);
          for (const u of noTokenUsers) {
            recipientRows.push({ userId: u.id, delivered: false });
          }
        }
        await db.createNotificationRecipients(logId, recipientRows);

        return { successCount, failureCount, totalTargets: tokens.length };
      }),

    history: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getNotificationHistory(30);
    }),

    recipients: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        return db.getNotificationRecipients(input.notificationId);
      }),

    markOpened: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.recordNotificationOpen(input.notificationId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Staff Duty Roster ─────────────────────────────────────────────────────────────────────
  duties: router({
    // List all duties, optionally filtered by staff name and/or quarter
    list: publicProcedure
      .input(z.object({
        staffName: z.string().optional(),
        quarter: z.enum(["Q1", "Q2", "Q3", "Q4", "all"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getStaffDuties(input?.staffName, input?.quarter);
      }),

    // List all unique staff names that have duties pre-loaded
    staffNames: publicProcedure.query(async () => {
      return db.getAllStaffDutyNames();
    }),

    // Create or update a duty entry (admin only)
    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        staffName: z.string().min(1).max(128),
        dutyType: z.enum(["morning_duty", "lunch_duty", "afternoon_duty", "carpool", "class_coverage", "iep", "other"]),
        dutyLabel: z.string().max(256).optional().nullable(),
        location: z.string().max(256).optional().nullable(),
        timeStart: z.string().max(16).optional().nullable(),
        timeEnd: z.string().max(16).optional().nullable(),
        quarter: z.enum(["Q1", "Q2", "Q3", "Q4", "all"]).default("all"),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        await db.upsertStaffDuty({ ...input, createdBy: ctx.user.id });
        return { success: true };
      }),

    // Delete a duty entry (admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        await db.deleteStaffDuty(input.id);
        return { success: true };
      }),
  }),
});

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export type AppRouter = typeof appRouter;

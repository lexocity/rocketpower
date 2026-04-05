import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  displayName: text("displayName"),
  expoPushToken: text("expoPushToken"),
  notificationsEnabled: integer("notificationsEnabled", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`(datetime('now'))`).notNull(),
  passwordHash: text("passwordHash"),
  passwordSalt: text("passwordSalt"),
  accountStatus: text("accountStatus", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Absences (Out of the Building) ──────────────────────────────────────────
export const absences = sqliteTable("absences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coverageDate: text("coverageDate").notNull(), // YYYY-MM-DD
  staffName: text("staffName").notNull(),
  timeRange: text("timeRange", { enum: ["all_day", "morning", "afternoon", "custom"] }).default("all_day").notNull(),
  customTimeStart: text("customTimeStart"),
  customTimeEnd: text("customTimeEnd"),
  subName: text("subName"),
  subStatus: text("subStatus", { enum: ["assigned", "no_sub", "new_sub", "split"] }).default("assigned").notNull(),
  isOAM: integer("isOAM", { mode: "boolean" }).default(false).notNull(),
  absenceType: text("absenceType", { enum: ["sick", "personal", "educational", "other", "unknown"] }).default("unknown").notNull(),
  employeeNumber: text("employeeNumber"),
  subNumber: text("subNumber"),
  notes: text("notes"),
  createdBy: integer("createdBy"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = typeof absences.$inferInsert;

// ─── Coverage Assignments ─────────────────────────────────────────────────────
export const coverageAssignments = sqliteTable("coverage_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coverageDate: text("coverageDate").notNull(), // YYYY-MM-DD
  coveringStaffName: text("coveringStaffName").notNull(),
  coveringFor: text("coveringFor").notNull(),
  location: text("location"),
  coverageReason: text("coverageReason", { enum: ["subbing", "iep", "absent", "class_coverage", "other"] }).default("subbing").notNull(),
  timeSlot: text("timeSlot", { enum: ["morning_duty", "lunch_duty", "afternoon_duty", "custom", "all_day"] }).default("custom").notNull(),
  customTimeStart: text("customTimeStart"),
  customTimeEnd: text("customTimeEnd"),
  notes: text("notes"),
  createdBy: integer("createdBy"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type CoverageAssignment = typeof coverageAssignments.$inferSelect;
export type InsertCoverageAssignment = typeof coverageAssignments.$inferInsert;

// ─── Notification Log ─────────────────────────────────────────────────────────
export const notificationLog = sqliteTable("notification_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sentBy: integer("sentBy").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  recipientType: text("recipientType", { enum: ["all", "specific"] }).default("all").notNull(),
  recipientIds: text("recipientIds"),
  successCount: integer("successCount").default(0).notNull(),
  failureCount: integer("failureCount").default(0).notNull(),
  sentAt: text("sentAt").default(sql`(datetime('now'))`).notNull(),
});

export type NotificationLog = typeof notificationLog.$inferSelect;
export type InsertNotificationLog = typeof notificationLog.$inferInsert;

// ─── Notification Recipients (who was targeted per send) ─────────────────────
export const notificationRecipients = sqliteTable("notification_recipients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  notificationId: integer("notificationId").notNull(),
  userId: integer("userId").notNull(),
  delivered: integer("delivered", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type NotificationRecipient = typeof notificationRecipients.$inferSelect;
export type InsertNotificationRecipient = typeof notificationRecipients.$inferInsert;

// ─── Notification Receipts (who opened/tapped the notification) ───────────────
export const notificationReceipts = sqliteTable("notification_receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  notificationId: integer("notificationId").notNull(),
  userId: integer("userId").notNull(),
  openedAt: text("openedAt").default(sql`(datetime('now'))`).notNull(),
});

export type NotificationReceipt = typeof notificationReceipts.$inferSelect;
export type InsertNotificationReceipt = typeof notificationReceipts.$inferInsert;

// ─── Staff Duty Roster (pre-loaded regular duties per staff member) ───────────
export const staffDuties = sqliteTable("staff_duties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  staffName: text("staffName").notNull(),
  dutyType: text("dutyType", {
    enum: ["morning_duty", "lunch_duty", "afternoon_duty", "carpool", "class_coverage", "iep", "other"],
  }).notNull(),
  dutyLabel: text("dutyLabel"),
  location: text("location"),
  timeStart: text("timeStart"),
  timeEnd: text("timeEnd"),
  quarter: text("quarter", { enum: ["Q1_Q3", "Q2_Q4", "all"] }).default("all").notNull(),
  notes: text("notes"),
  createdBy: integer("createdBy"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type StaffDuty = typeof staffDuties.$inferSelect;
export type InsertStaffDuty = typeof staffDuties.$inferInsert;

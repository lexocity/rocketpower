import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  displayName: varchar("displayName", { length: 128 }),
  expoPushToken: varchar("expoPushToken", { length: 256 }),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("passwordHash", { length: 128 }),
  passwordSalt: varchar("passwordSalt", { length: 64 }),
  accountStatus: mysqlEnum("accountStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Absences (Out of the Building) ──────────────────────────────────────────
export const absences = mysqlTable("absences", {
  id: int("id").autoincrement().primaryKey(),
  coverageDate: varchar("coverageDate", { length: 10 }).notNull(), // YYYY-MM-DD
  staffName: varchar("staffName", { length: 128 }).notNull(),
  timeRange: mysqlEnum("timeRange", ["all_day", "morning", "afternoon", "custom"]).default("all_day").notNull(),
  customTimeStart: varchar("customTimeStart", { length: 16 }),
  customTimeEnd: varchar("customTimeEnd", { length: 16 }),
  subName: varchar("subName", { length: 128 }),
  subStatus: mysqlEnum("subStatus", ["assigned", "no_sub", "new_sub", "split"]).default("assigned").notNull(),
  isOAM: boolean("isOAM").default(false).notNull(),
  absenceType: mysqlEnum("absenceType", ["sick", "personal", "educational", "other", "unknown"]).default("unknown").notNull(),
  employeeNumber: varchar("employeeNumber", { length: 32 }),
  subNumber: varchar("subNumber", { length: 32 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = typeof absences.$inferInsert;

// ─── Coverage Assignments ─────────────────────────────────────────────────────
export const coverageAssignments = mysqlTable("coverage_assignments", {
  id: int("id").autoincrement().primaryKey(),
  coverageDate: varchar("coverageDate", { length: 10 }).notNull(), // YYYY-MM-DD
  coveringStaffName: varchar("coveringStaffName", { length: 128 }).notNull(),
  coveringFor: varchar("coveringFor", { length: 128 }).notNull(),
  location: varchar("location", { length: 256 }),
  coverageReason: mysqlEnum("coverageReason", ["subbing", "iep", "absent", "class_coverage", "other"]).default("subbing").notNull(),
  timeSlot: mysqlEnum("timeSlot", ["morning_duty", "lunch_duty", "afternoon_duty", "custom", "all_day"]).default("custom").notNull(),
  customTimeStart: varchar("customTimeStart", { length: 16 }),
  customTimeEnd: varchar("customTimeEnd", { length: 16 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoverageAssignment = typeof coverageAssignments.$inferSelect;
export type InsertCoverageAssignment = typeof coverageAssignments.$inferInsert;

// ─── Notification Log ─────────────────────────────────────────────────────────
export const notificationLog = mysqlTable("notification_log", {
  id: int("id").autoincrement().primaryKey(),
  sentBy: int("sentBy").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  recipientType: mysqlEnum("recipientType", ["all", "specific"]).default("all").notNull(),
  recipientIds: text("recipientIds"),
  successCount: int("successCount").default(0).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLog.$inferSelect;
export type InsertNotificationLog = typeof notificationLog.$inferInsert;

// ─── Notification Recipients (who was targeted per send) ─────────────────────
export const notificationRecipients = mysqlTable("notification_recipients", {
  id: int("id").autoincrement().primaryKey(),
  notificationId: int("notificationId").notNull(),
  userId: int("userId").notNull(),
  delivered: boolean("delivered").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationRecipient = typeof notificationRecipients.$inferSelect;
export type InsertNotificationRecipient = typeof notificationRecipients.$inferInsert;

// ─── Notification Receipts (who opened/tapped the notification) ───────────────
export const notificationReceipts = mysqlTable("notification_receipts", {
  id: int("id").autoincrement().primaryKey(),
  notificationId: int("notificationId").notNull(),
  userId: int("userId").notNull(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
});

export type NotificationReceipt = typeof notificationReceipts.$inferSelect;
export type InsertNotificationReceipt = typeof notificationReceipts.$inferInsert;

// ─── Staff Duty Roster (pre-loaded regular duties per staff member) ───────────
export const staffDuties = mysqlTable("staff_duties", {
  id: int("id").autoincrement().primaryKey(),
  staffName: varchar("staffName", { length: 128 }).notNull(),
  dutyType: mysqlEnum("dutyType", [
    "morning_duty",
    "lunch_duty",
    "afternoon_duty",
    "carpool",
    "class_coverage",
    "iep",
    "other",
  ]).notNull(),
  dutyLabel: varchar("dutyLabel", { length: 256 }), // e.g. "Carpool Purple", "Lunch Duty 11:10–11:35"
  location: varchar("location", { length: 256 }),   // e.g. "Carpool Purple", "Daughenbaugh Purple"
  timeStart: varchar("timeStart", { length: 16 }),  // e.g. "11:10"
  timeEnd: varchar("timeEnd", { length: 16 }),      // e.g. "11:35"
  quarter: mysqlEnum("quarter", ["Q1", "Q2", "Q3", "Q4", "all"]).default("all").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffDuty = typeof staffDuties.$inferSelect;
export type InsertStaffDuty = typeof staffDuties.$inferInsert;

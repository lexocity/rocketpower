import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import {
  absences,
  coverageAssignments,
  InsertAbsence,
  InsertCoverageAssignment,
  InsertNotificationLog,
  InsertStaffDuty,
  InsertUser,
  notificationLog,
  notificationRecipients,
  notificationReceipts,
  staffDuties,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export function getDb() {
  if (!_db) {
    try {
      const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "rocketpower.db");
      const sqlite = new Database(dbPath);
      // Enable WAL mode for better concurrent read performance
      sqlite.pragma("journal_mode = WAL");
      _db = drizzle(sqlite);
    } catch (error) {
      console.warn("[Database] Failed to open SQLite database:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const existing = db.select().from(users).where(eq(users.openId, user.openId)).limit(1).all();

    if (existing.length > 0) {
      const updateSet: Record<string, unknown> = { lastSignedIn: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (user.name !== undefined) updateSet.name = user.name ?? null;
      if (user.email !== undefined) updateSet.email = user.email ?? null;
      if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod ?? null;
      if (user.role !== undefined) updateSet.role = user.role;
      db.update(users).set(updateSet).where(eq(users.openId, user.openId)).run();
    } else {
      const values: InsertUser = {
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.openId === ENV.ownerOpenId ? "admin" : (user.role ?? "user"),
        lastSignedIn: new Date().toISOString(),
      };
      db.insert(users).values(values).run();
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1).all();
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = getDb();
  if (!db) return;
  db.update(users).set({ role, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run();
}

export async function updateAccountStatus(userId: number, status: "pending" | "approved" | "rejected") {
  const db = getDb();
  if (!db) return;
  db.update(users).set({ accountStatus: status, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run();
}

export async function getPendingUsers() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.accountStatus, "pending")).orderBy(users.createdAt).all();
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = db.select().from(users).where(eq(users.openId, openId)).limit(1).all();
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.name).all();
}

export async function updateUserPushToken(userId: number, token: string | null) {
  const db = getDb();
  if (!db) return;
  db.update(users).set({ expoPushToken: token, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run();
}

export async function getUsersWithPushTokens(userIds?: number[]) {
  const db = getDb();
  if (!db) return [];
  void userIds;
  return db.select().from(users).where(and(eq(users.notificationsEnabled, true))).all();
}

// ─── Absences ───────────────────────────────────────────────────────────────
export async function getAbsencesByDate(date: string) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(absences).where(eq(absences.coverageDate, date)).orderBy(absences.createdAt).all();
}

export async function createAbsence(data: InsertAbsence) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = db.insert(absences).values(data).run();
  return Number(result.lastInsertRowid);
}

export async function updateAbsence(id: number, data: Partial<InsertAbsence>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  db.update(absences).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(absences.id, id)).run();
}

export async function deleteAbsence(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  db.delete(absences).where(eq(absences.id, id)).run();
}

// ─── Coverage Assignments ─────────────────────────────────────────────────────
export async function getCoverageByDate(date: string) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(coverageAssignments).where(eq(coverageAssignments.coverageDate, date)).orderBy(coverageAssignments.createdAt).all();
}

export async function createCoverage(data: InsertCoverageAssignment) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = db.insert(coverageAssignments).values(data).run();
  return Number(result.lastInsertRowid);
}

export async function updateCoverage(id: number, data: Partial<InsertCoverageAssignment>) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  db.update(coverageAssignments).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(coverageAssignments.id, id)).run();
}

export async function deleteCoverage(id: number) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  db.delete(coverageAssignments).where(eq(coverageAssignments.id, id)).run();
}

// ─── Notification Log ─────────────────────────────────────────────────────────
export async function createNotificationLog(data: InsertNotificationLog) {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = db.insert(notificationLog).values(data).run();
  return Number(result.lastInsertRowid);
}

export async function getNotificationHistory(limit = 20) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(notificationLog).orderBy(desc(notificationLog.sentAt)).limit(limit).all();
}

// ─── Notification Recipients ──────────────────────────────────────────────────
export async function createNotificationRecipients(
  notificationId: number,
  recipients: Array<{ userId: number; delivered: boolean }>
) {
  const db = getDb();
  if (!db || recipients.length === 0) return;
  db.insert(notificationRecipients).values(
    recipients.map((r) => ({ notificationId, userId: r.userId, delivered: r.delivered }))
  ).run();
}

export async function getNotificationRecipients(notificationId: number) {
  const db = getDb();
  if (!db) return [];
  const recs = db
    .select()
    .from(notificationRecipients)
    .where(eq(notificationRecipients.notificationId, notificationId))
    .all();

  if (recs.length === 0) return [];

  const userIds = recs.map((r) => r.userId);
  const userList = db.select().from(users).where(inArray(users.id, userIds)).all();
  const userMap = new Map(userList.map((u) => [u.id, u]));

  const receipts = db
    .select()
    .from(notificationReceipts)
    .where(eq(notificationReceipts.notificationId, notificationId))
    .all();
  const openedSet = new Set(receipts.map((r) => r.userId));
  const openedAtMap = new Map(receipts.map((r) => [r.userId, r.openedAt]));

  return recs.map((r) => ({
    userId: r.userId,
    delivered: r.delivered,
    opened: openedSet.has(r.userId),
    openedAt: openedAtMap.get(r.userId) ?? null,
    user: userMap.get(r.userId) ?? null,
  }));
}

// ─── Bulk Operations ─────────────────────────────────────────────────────────
export async function bulkReplaceAbsences(date: string, rows: InsertAbsence[]) {
  const db = getDb();
  if (!db) return;
  db.delete(absences).where(eq(absences.coverageDate, date)).run();
  if (rows.length > 0) {
    db.insert(absences).values(rows).run();
  }
}

export async function bulkReplaceCoverage(date: string, rows: InsertCoverageAssignment[]) {
  const db = getDb();
  if (!db) return;
  db.delete(coverageAssignments).where(eq(coverageAssignments.coverageDate, date)).run();
  if (rows.length > 0) {
    db.insert(coverageAssignments).values(rows).run();
  }
}

// ─── Staff Duty Roster ────────────────────────────────────────────────────────
export async function getStaffDuties(staffName?: string, quarter?: string) {
  const db = getDb();
  if (!db) return [];
  const conditions = [];
  if (staffName) conditions.push(eq(staffDuties.staffName, staffName));
  if (quarter && quarter !== "all") {
    const { or } = await import("drizzle-orm");
    conditions.push(or(eq(staffDuties.quarter, quarter as any), eq(staffDuties.quarter, "all")));
  }
  return conditions.length > 0
    ? db.select().from(staffDuties).where(conditions.length === 1 ? conditions[0] : (await import("drizzle-orm")).and(...conditions)).orderBy(staffDuties.staffName).all()
    : db.select().from(staffDuties).orderBy(staffDuties.staffName).all();
}

export async function getAllStaffDutyNames() {
  const db = getDb();
  if (!db) return [];
  const rows = db.selectDistinct({ staffName: staffDuties.staffName }).from(staffDuties).orderBy(staffDuties.staffName).all();
  return rows.map((r) => r.staffName);
}

export async function upsertStaffDuty(data: InsertStaffDuty & { id?: number }) {
  const db = getDb();
  if (!db) return;
  if (data.id) {
    const { id, ...rest } = data;
    db.update(staffDuties).set({ ...rest, updatedAt: new Date().toISOString() }).where(eq(staffDuties.id, id)).run();
  } else {
    db.insert(staffDuties).values(data).run();
  }
}

export async function deleteStaffDuty(id: number) {
  const db = getDb();
  if (!db) return;
  db.delete(staffDuties).where(eq(staffDuties.id, id)).run();
}

export async function recordNotificationOpen(notificationId: number, userId: number) {
  const db = getDb();
  if (!db) return;
  const existing = db
    .select()
    .from(notificationReceipts)
    .where(
      and(
        eq(notificationReceipts.notificationId, notificationId),
        eq(notificationReceipts.userId, userId)
      )
    )
    .limit(1)
    .all();
  if (existing.length === 0) {
    db.insert(notificationReceipts).values({ notificationId, userId }).run();
  }
}

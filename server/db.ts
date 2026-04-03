import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateAccountStatus(userId: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ accountStatus: status }).where(eq(users.id, userId));
}

export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.accountStatus, "pending")).orderBy(users.createdAt);
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.name);
}

export async function updateUserPushToken(userId: number, token: string | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ expoPushToken: token }).where(eq(users.id, userId));
}

export async function getUsersWithPushTokens(userIds?: number[]) {
  const db = await getDb();
  if (!db) return [];
  // If specific IDs provided, filter; otherwise get all with notifications enabled
  void userIds; // used by caller to filter post-query if needed
  return db.select().from(users).where(and(eq(users.notificationsEnabled, true)));
}

// ─── Absences ───────────────────────────────────────────────────────────────
export async function getAbsencesByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(absences).where(eq(absences.coverageDate, date)).orderBy(absences.createdAt);
}

export async function createAbsence(data: InsertAbsence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(absences).values(data);
  return result[0].insertId;
}

export async function updateAbsence(id: number, data: Partial<InsertAbsence>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(absences).set(data).where(eq(absences.id, id));
}

export async function deleteAbsence(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(absences).where(eq(absences.id, id));
}

// ─── Coverage Assignments ─────────────────────────────────────────────────────
export async function getCoverageByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coverageAssignments).where(eq(coverageAssignments.coverageDate, date)).orderBy(coverageAssignments.createdAt);
}

export async function createCoverage(data: InsertCoverageAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coverageAssignments).values(data);
  return result[0].insertId;
}

export async function updateCoverage(id: number, data: Partial<InsertCoverageAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coverageAssignments).set(data).where(eq(coverageAssignments.id, id));
}

export async function deleteCoverage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coverageAssignments).where(eq(coverageAssignments.id, id));
}

// ─── Notification Log ─────────────────────────────────────────────────────────
export async function createNotificationLog(data: InsertNotificationLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notificationLog).values(data);
  return result[0].insertId;
}

export async function getNotificationHistory(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificationLog).orderBy(desc(notificationLog.sentAt)).limit(limit);
}

// ─── Notification Recipients ──────────────────────────────────────────────────
export async function createNotificationRecipients(
  notificationId: number,
  recipients: Array<{ userId: number; delivered: boolean }>
) {
  const db = await getDb();
  if (!db || recipients.length === 0) return;
  await db.insert(notificationRecipients).values(
    recipients.map((r) => ({ notificationId, userId: r.userId, delivered: r.delivered }))
  );
}

export async function getNotificationRecipients(notificationId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get recipients joined with user info
  const recs = await db
    .select()
    .from(notificationRecipients)
    .where(eq(notificationRecipients.notificationId, notificationId));

  if (recs.length === 0) return [];

  const userIds = recs.map((r) => r.userId);
  const userList = await db.select().from(users).where(inArray(users.id, userIds));
  const userMap = new Map(userList.map((u) => [u.id, u]));

  // Get receipts (opens) for this notification
  const receipts = await db
    .select()
    .from(notificationReceipts)
    .where(eq(notificationReceipts.notificationId, notificationId));
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

// ─── Notification Receipts (read tracking) ──────────────────────────────
// ─── Bulk Operations ─────────────────────────────────────────────────────────
export async function bulkReplaceAbsences(date: string, rows: InsertAbsence[]) {
  const db = await getDb();
  if (!db) return;
  // Delete all existing absences for the date, then insert the new rows
  await db.delete(absences).where(eq(absences.coverageDate, date));
  if (rows.length > 0) {
    await db.insert(absences).values(rows);
  }
}

export async function bulkReplaceCoverage(date: string, rows: InsertCoverageAssignment[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(coverageAssignments).where(eq(coverageAssignments.coverageDate, date));
  if (rows.length > 0) {
    await db.insert(coverageAssignments).values(rows);
  }
}

// ─── Staff Duty Roster ────────────────────────────────────────────────────────────────────
export async function getStaffDuties(staffName?: string, quarter?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (staffName) conditions.push(eq(staffDuties.staffName, staffName));
  if (quarter && quarter !== "all") {
    // Return duties that match the quarter OR are marked "all"
    const { or } = await import("drizzle-orm");
    conditions.push(or(eq(staffDuties.quarter, quarter as any), eq(staffDuties.quarter, "all")));
  }
  return conditions.length > 0
    ? db.select().from(staffDuties).where(conditions.length === 1 ? conditions[0] : (await import("drizzle-orm")).and(...conditions)).orderBy(staffDuties.staffName)
    : db.select().from(staffDuties).orderBy(staffDuties.staffName);
}

export async function getAllStaffDutyNames() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.selectDistinct({ staffName: staffDuties.staffName }).from(staffDuties).orderBy(staffDuties.staffName);
  return rows.map((r) => r.staffName);
}

export async function upsertStaffDuty(data: InsertStaffDuty & { id?: number }) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    const { id, ...rest } = data;
    await db.update(staffDuties).set(rest).where(eq(staffDuties.id, id));
  } else {
    await db.insert(staffDuties).values(data);
  }
}

export async function deleteStaffDuty(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(staffDuties).where(eq(staffDuties.id, id));
}

export async function recordNotificationOpen(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  // Only record once per user per notification
  const existing = await db
    .select()
    .from(notificationReceipts)
    .where(
      and(
        eq(notificationReceipts.notificationId, notificationId),
        eq(notificationReceipts.userId, userId)
      )
    )
    .limit(1);
  if (existing.length === 0) {
    await db.insert(notificationReceipts).values({ notificationId, userId });
  }
}

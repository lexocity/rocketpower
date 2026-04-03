import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  absences,
  coverageAssignments,
  InsertAbsence,
  InsertCoverageAssignment,
  InsertNotificationLog,
  InsertUser,
  notificationLog,
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

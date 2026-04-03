/**
 * Custom email/password authentication for RocketPower.
 * Teachers and staff self-register; accounts start as "pending" until an admin approves them.
 */
import type { Express, Request, Response } from "express";
import { createHash, randomBytes } from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function registerAuthRoutes(app: Express) {
  // ─── Email/Password Login ──────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    try {
      const user = await db.getUserByEmail(email.trim().toLowerCase());
      if (!user || !user.passwordHash || !user.passwordSalt) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const hash = hashPassword(password, user.passwordSalt);
      if (hash !== user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      // Block pending/rejected accounts from logging in
      if (user.accountStatus === "pending") {
        res.status(403).json({ error: "pending", message: "Your account is awaiting admin approval. You will be notified once approved." });
        return;
      }
      if (user.accountStatus === "rejected") {
        res.status(403).json({ error: "rejected", message: "Your account request was not approved. Please contact your school administrator." });
        return;
      }

      // Update last signed in
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        token: sessionToken,
        user: {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          loginMethod: "email",
          lastSignedIn: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("[Auth] Login error:", err);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // ─── Self-Service Registration (open, no secret required) ─────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body ?? {};

    if (!email || !password || !name) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }

    try {
      const existing = await db.getUserByEmail(email.trim().toLowerCase());
      if (existing) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
      }

      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      const openId = `email:${email.trim().toLowerCase()}`;

      // New accounts start as "pending" — admin must approve before they can log in
      await db.upsertUser({
        openId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        loginMethod: "email",
        lastSignedIn: new Date(),
        passwordHash: hash,
        passwordSalt: salt,
        accountStatus: "pending",
      });

      res.json({ success: true, message: "Account request submitted! An admin will review and approve your account shortly." });
    } catch (err) {
      console.error("[Auth] Register error:", err);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // ─── Admin: Approve / Reject Account ─────────────────────────────────────
  app.post("/api/auth/approve", async (req: Request, res: Response) => {
    try {
      const requestingUser = await sdk.authenticateRequest(req);
      if (requestingUser.role !== "admin") {
        res.status(403).json({ error: "Admin only." });
        return;
      }

      const { userId, status } = req.body ?? {};
      if (!userId || !["approved", "rejected"].includes(status)) {
        res.status(400).json({ error: "userId and status (approved|rejected) are required." });
        return;
      }

      await db.updateAccountStatus(userId, status);
      res.json({ success: true });
    } catch (err) {
      console.error("[Auth] Approve error:", err);
      res.status(500).json({ error: "Failed to update account status." });
    }
  });

  // ─── Update Role (Admin only) ─────────────────────────────────────────────
  app.post("/api/auth/set-role", async (req: Request, res: Response) => {
    try {
      const requestingUser = await sdk.authenticateRequest(req);
      if (requestingUser.role !== "admin") {
        res.status(403).json({ error: "Admin only." });
        return;
      }

      const { userId, role } = req.body ?? {};
      if (!userId || !["user", "admin"].includes(role)) {
        res.status(400).json({ error: "userId and role (user|admin) are required." });
        return;
      }

      await db.updateUserRole(userId, role);
      res.json({ success: true });
    } catch (err) {
      console.error("[Auth] Set role error:", err);
      res.status(500).json({ error: "Failed to update role." });
    }
  });
}

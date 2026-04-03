/**
 * Custom email/password authentication for RocketPower.
 * Teachers and staff use email + password to log in.
 * Admins can be set via the database or by being the owner account.
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
          loginMethod: "email",
          lastSignedIn: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("[Auth] Login error:", err);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // ─── Register (Admin creates staff accounts) ──────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name, adminSecret } = req.body ?? {};

    // Require admin secret for registration (set in env or use a default)
    const secret = process.env.ADMIN_REGISTER_SECRET || "rocketpower-admin-2026";
    if (adminSecret !== secret) {
      res.status(403).json({ error: "Invalid admin secret." });
      return;
    }

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
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

      await db.upsertUser({
        openId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        loginMethod: "email",
        lastSignedIn: new Date(),
        passwordHash: hash,
        passwordSalt: salt,
      });

      res.json({ success: true, message: "Account created successfully." });
    } catch (err) {
      console.error("[Auth] Register error:", err);
      res.status(500).json({ error: "Registration failed. Please try again." });
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

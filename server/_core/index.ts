import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { createHash, randomBytes } from "crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerAuthRoutes } from "../auth-routes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDb } from "../db";
import * as db from "../db";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

/**
 * Seeds a default admin account on every startup if it doesn't already exist.
 * Credentials come from environment variables SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.
 * Falls back to hardcoded defaults so the app is always accessible for testing.
 */
async function seedAdminAccount() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "aalicea@wcpss.net").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Beezer122@";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  try {
    const salt = randomBytes(16).toString("hex");
    const hash = hashPassword(password, salt);
    const openId = `email:${email}`;
    // Always upsert — ensures password, role, and status are correct even after a redeploy
    await db.upsertUser({
      openId,
      name,
      email,
      loginMethod: "email",
      lastSignedIn: new Date(),
      passwordHash: hash,
      passwordSalt: salt,
      accountStatus: "approved",
      role: "admin",
    });
    console.log(`[Seed] Admin account ready: ${email}`);
  } catch (err) {
    console.error("[Seed] Failed to seed admin account:", err);
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Run database migrations on startup
  try {
    const database = getDb();
    if (database) {
      const migrationsFolder = path.join(process.cwd(), "drizzle", "migrations");
      migrate(database, { migrationsFolder });
      console.log("[Database] Migrations applied successfully");
    }
  } catch (err) {
    console.error("[Database] Migration error:", err);
  }

  // Seed default admin account (safe to run on every startup)
  await seedAdminAccount();

  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  registerAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now(), version: "spacetheme1" });
  });

  // Temporary debug endpoint - remove after fixing
  app.post("/api/debug/verify-token", async (req: Request, res: Response) => {
    const { token } = req.body ?? {};
    if (!token) {
      res.status(400).json({ error: "token required" });
      return;
    }
    try {
      const { jwtVerify } = await import("jose");
      const secret = process.env.JWT_SECRET ?? "";
      const secretKey = new TextEncoder().encode(secret);
      try {
        const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
        res.json({ success: true, payload, secretLength: secret.length, secretFirst4: secret.substring(0, 4) });
      } catch (verifyErr) {
        res.json({ success: false, error: String(verifyErr), secretLength: secret.length, secretFirst4: secret.substring(0, 4) });
      }
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Debug: trace the full authenticateRequest flow
  app.get("/api/debug/auth-trace", async (req: Request, res: Response) => {
    const steps: string[] = [];
    try {
      const { sdk: sdkInstance } = await import("./sdk");
      const authHeader = req.headers.authorization || req.headers["Authorization"];
      steps.push(`authHeader: ${authHeader ? String(authHeader).substring(0, 30) : "none"}`);
      const rawCookie = req.headers.cookie;
      steps.push(`raw cookie header: ${rawCookie ? rawCookie.substring(0, 80) : "none"}`);
      try {
        const user = await sdkInstance.authenticateRequest(req);
        steps.push(`authenticateRequest: SUCCESS - user=${user.name} role=${user.role}`);
        res.json({ steps, result: "SUCCESS", user: { name: user.name, role: user.role } });
      } catch (authErr) {
        steps.push(`authenticateRequest: FAILED - ${String(authErr)}`);
        res.json({ steps, result: "FAIL", error: String(authErr) });
      }
    } catch (err) {
      res.json({ steps, error: String(err) });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Serve Expo web static export in production
  const webDistPath = path.join(process.cwd(), "dist");
  const webIndexPath = path.join(webDistPath, "index.html");
  if (fs.existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
    // Catch-all: return index.html for client-side routing (must be after API routes)
    app.get("*", (_req, res) => {
      if (fs.existsSync(webIndexPath)) {
        res.sendFile(webIndexPath);
      } else {
        res.status(404).send("Not Found");
      }
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);

import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Known public suffixes where setting a parent domain cookie would be rejected
 * by browsers (per the Public Suffix List). For these hosts, we omit the domain
 * attribute so the browser scopes the cookie to the exact hostname.
 */
const PUBLIC_SUFFIX_PARENTS = new Set([
  "onrender.com",
  "vercel.app",
  "netlify.app",
  "github.io",
  "pages.dev",
  "fly.dev",
  "railway.app",
  "up.railway.app",
  "herokuapp.com",
  "glitch.me",
  "replit.dev",
  "repl.co",
]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");

  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

/**
 * Extract parent domain for cookie sharing across subdomains.
 * e.g., "3000-xxx.manuspre.computer" -> ".manuspre.computer"
 * This allows cookies set by 3000-xxx to be read by 8081-xxx.
 *
 * Returns undefined for:
 * - localhost / IP addresses
 * - hostnames with fewer than 3 parts (no subdomain)
 * - known public suffix parents (e.g. onrender.com) — browsers reject these
 */
function getParentDomain(hostname: string): string | undefined {
  // Don't set domain for localhost or IP addresses
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return undefined;
  }

  // Split hostname into parts
  const parts = hostname.split(".");

  // Need at least 3 parts for a subdomain (e.g., "3000-xxx.manuspre.computer")
  // For "manuspre.computer", we can't set a parent domain
  if (parts.length < 3) {
    return undefined;
  }

  // Compute the candidate parent domain (last 2 parts)
  const parentDomain = parts.slice(-2).join(".");

  // Don't set domain if the parent is a known public suffix —
  // browsers silently reject Set-Cookie with Domain=<public-suffix>
  if (PUBLIC_SUFFIX_PARENTS.has(parentDomain)) {
    return undefined;
  }

  // Return parent domain with leading dot (e.g., ".manuspre.computer")
  // This allows cookie to be shared across all subdomains
  return "." + parentDomain;
}

export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const domain = getParentDomain(hostname);

  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}

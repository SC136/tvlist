/**
 * The public URL of this deployment, without a trailing slash.
 *
 * Order: an explicit BETTER_AUTH_URL, then Vercel's production domain (production
 * deployments only), then the unique URL of the current Vercel deployment (previews),
 * then localhost. Works with no configuration on Vercel; set BETTER_AUTH_URL to use
 * a custom domain.
 */
export function siteUrl(): string {
  const explicit = process.env.BETTER_AUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL_ENV === "production" && production) return `https://${production}`;
  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;
  return "http://localhost:3000";
}

/** Every origin that may legitimately call the auth API (the site URL plus Vercel aliases). */
export function trustedOrigins(): string[] {
  const origins = new Set<string>([siteUrl()]);
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) origins.add(`https://${host}`);
  }
  // Vercel assigns several aliases per project (omnilist-<hash>.vercel.app, omnilist-sc136.vercel.app, ...).
  if (process.env.VERCEL) origins.add("https://omnilist-*.vercel.app");
  if (process.env.NODE_ENV !== "production") origins.add("http://localhost:3000");
  return [...origins];
}

import { Redirect } from 'expo-router';

/**
 * Web: "/" is intercepted by Vercel's rewrites and served as the static
 * marketing landing page (public/landing.html) before this ever loads —
 * this file only matters as a fallback. Native: there is no marketing site,
 * so the app always boots straight into the real entry point at "/app".
 */
export default function Index() {
  return <Redirect href="/app" />;
}

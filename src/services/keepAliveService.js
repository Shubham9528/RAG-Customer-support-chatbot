/**
 * Keep-Alive Service for Render Web Services.
 *
 * Render free-tier web services spin down after 15 minutes of inactivity.
 * This service pings the server's health check every 14 minutes and 30 seconds
 * to prevent the service from becoming inactive.
 */

const INTERVAL_MS = (14 * 60 + 30) * 1000; // 14 minutes 30 seconds (870,000 ms)

export function startKeepAlive(port = 3000) {
  // Render automatically injects RENDER_EXTERNAL_URL (e.g. https://your-app.onrender.com)
  const baseUrl = process.env.SERVER_URL || `http://localhost:${port}`;

  const pingUrl = `${baseUrl.replace(/\/$/, "")}/api/health`;

  console.log(
    `⏱️  Keep-alive service initialized for: ${pingUrl} (every 14m 30s)`,
  );

  const intervalId = setInterval(async () => {
    try {
      const response = await fetch(pingUrl);
      if (response.ok) {
        console.log(
          `💓 [Keep-Alive] Pinged ${pingUrl} at ${new Date().toLocaleTimeString()} - Status: ${response.status}`,
        );
      } else {
        console.warn(`⚠️ [Keep-Alive] Ping returned status ${response.status}`);
      }
    } catch (err) {
      console.error(`⚠️ [Keep-Alive] Ping failed: ${err.message}`);
    }
  }, INTERVAL_MS);

  // Allow the Node process to exit cleanly if needed
  if (intervalId.unref) {
    intervalId.unref();
  }

  return intervalId;
}

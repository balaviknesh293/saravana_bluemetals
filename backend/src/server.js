const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function sanitizeBrokenProxyEnv() {
  const proxyKeys = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"];
  const looksBroken = (value) => {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return false;
    return text.includes("127.0.0.1:9") || text.includes("localhost:9");
  };
  for (const key of proxyKeys) {
    if (looksBroken(process.env[key])) {
      delete process.env[key];
    }
  }
}

sanitizeBrokenProxyEnv();

const app = require("./app");
const { bootstrapSheets } = require("./services/bootstrapService");
const sheetsService = require("./services/sheetsService");

const PORT = Number(process.env.PORT || 5000);

async function start() {
  try {
    try {
      await bootstrapSheets();
    } catch (error) {
      const allowFallback = process.env.ALLOW_LOCAL_FALLBACK_ON_BOOTSTRAP_ERROR !== "false";
      if (!allowFallback) {
        throw error;
      }

      console.error("Google Sheets bootstrap failed, falling back to local store:", error.message);
      sheetsService.useLocalStore = true;
      await bootstrapSheets();
    }

    app.listen(PORT, () => {
      console.log(`Saravana Blue Metals API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start API:", error.message);
    process.exit(1);
  }
}

start();

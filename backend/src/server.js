const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

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

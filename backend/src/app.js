const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const materialRoutes = require("./routes/materialRoutes");
const salesRoutes = require("./routes/salesRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const systemRoutes = require("./routes/systemRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    name: "Saravana Blue Metals ERP API",
    health: "/api/health"
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", date: new Date().toISOString() });
});

app.use("/api", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api", ledgerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/system", systemRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
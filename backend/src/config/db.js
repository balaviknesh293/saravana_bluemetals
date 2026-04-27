const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

async function connectDB() {
  const useInMemoryDb = process.env.USE_IN_MEMORY_DB === "true";
  let mongoUri = process.env.MONGODB_URI;

  if (useInMemoryDb) {
    memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
    console.log("Using in-memory MongoDB for development.");
  }

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env or set USE_IN_MEMORY_DB=true");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

module.exports = connectDB;

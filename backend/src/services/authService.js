const bcrypt = require("bcryptjs");

const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/token");

async function loginAdmin({ email, password }) {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@saravanabluemetals.com").toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (email.toLowerCase() !== adminEmail) {
    throw new ApiError(401, "Invalid credentials.");
  }

  let isValid = false;
  if (passwordHash) {
    isValid = await bcrypt.compare(password, passwordHash);
  } else if (plainPassword) {
    isValid = plainPassword === password;
  }

  if (!isValid) {
    throw new ApiError(401, "Invalid credentials.");
  }

  const user = {
    id: "ADMIN001",
    name: "Saravana Blue Metals Admin",
    email: adminEmail,
    role: "admin"
  };

  const token = generateToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  return { user, token };
}

module.exports = { loginAdmin };
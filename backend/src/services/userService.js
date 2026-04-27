const fs = require("fs");
const path = require("path");

const usersPath = path.join(__dirname, "../data/users.json");

function getUsers() {
  const raw = fs.readFileSync(usersPath, "utf-8");
  return JSON.parse(raw);
}

function findUserByUsername(username) {
  const users = getUsers();
  return users.find((user) => user.username === username);
}

module.exports = {
  findUserByUsername
};
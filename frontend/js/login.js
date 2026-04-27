const loginForm = document.getElementById("loginForm");
const messageText = document.getElementById("message");

// If already logged in, skip login page.
checkSession();

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const username = formData.get("username").trim();
  const password = formData.get("password").trim();

  messageText.textContent = "";

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();

  if (!response.ok) {
    messageText.textContent = result.message || "Login failed.";
    return;
  }

  window.location.href = "/dashboard.html";
});

async function checkSession() {
  const response = await fetch("/api/auth/me");

  if (response.ok) {
    window.location.href = "/dashboard.html";
  }
}
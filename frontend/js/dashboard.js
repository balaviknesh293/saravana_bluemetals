const welcomeText = document.getElementById("welcomeText");
const logoutButton = document.getElementById("logoutButton");

loadCurrentUser();

logoutButton.addEventListener("click", async () => {
  const response = await fetch("/api/auth/logout", {
    method: "POST"
  });

  if (response.ok) {
    window.location.href = "/login.html";
    return;
  }

  alert("Logout failed. Please try again.");
});

async function loadCurrentUser() {
  const response = await fetch("/api/auth/me");

  if (!response.ok) {
    window.location.href = "/login.html";
    return;
  }

  const result = await response.json();
  const displayName = result.user.displayName || result.user.username;

  welcomeText.textContent = `Welcome, ${displayName}`;
}
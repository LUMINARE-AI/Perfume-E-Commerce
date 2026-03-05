export function logout(navigate, redirectTo = "/") {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Tell Navbar to re-check auth state immediately
  window.dispatchEvent(new Event("auth:changed"));

  if (navigate) {
    navigate(redirectTo);
  } else {
    window.location.href = redirectTo;
  }
}
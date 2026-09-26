(function () {
  var preference = "system";
  try {
    preference = localStorage.getItem("ultron.theme") || "system";
  } catch (error) {
    // Storage can be unavailable; fall back to the system theme.
  }
  var dark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
})();

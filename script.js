const DISCORD_ID = "1217443106069155841";
const GITHUB_USER = "rafmcccc";

const STATUS_COLORS = {
  online: "var(--online)",
  idle: "var(--idle)",
  dnd: "var(--dnd)",
  offline: "var(--offline)"
};
const STATUS_LABELS = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline"
};

function clock(){
  const d = new Date();
  const pad = (n) => n.toString().padStart(2,"0");
  document.getElementById("clock").textContent =
    pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}
clock();
setInterval(clock, 1000);

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function activityLine(data){
  const box = document.getElementById("activity");
  const lines = [];

  const spotify = data.spotify;
  if (spotify) {
    lines.push('<div><span class="k">Listening: </span>' +
      escapeHtml(spotify.song) + " — " + escapeHtml(spotify.artist) + "</div>");
  }

  const acts = (data.activities || []).filter((a) =>
    a.type === 0 && a.name !== "Spotify"
  );
  if (acts.length) {
    const a = acts[0];
    let line = escapeHtml(a.name);
    if (a.details) line += " — " + escapeHtml(a.details);
    lines.push('<div><span class="k">Playing: </span>' + line + "</div>");
  }

  if (data.custom_status && data.custom_status.state) {
    lines.push('<div><span class="k">Status: </span>' +
      escapeHtml(data.custom_status.state) + "</div>");
  }

  if (lines.length) {
    box.innerHTML = lines.join("");
    box.classList.add("show");
  } else {
    box.classList.remove("show");
    box.innerHTML = "";
  }
}

let discordInterval;
let repoInterval;

function loadDiscord(){
  fetch("https://api.lanyard.rest/v1/users/" + DISCORD_ID)
    .then((r) => r.json())
    .then((res) => {
      if (!res.success) throw new Error("lanyard error");
      const data = res.data;
      const user = data.discord_user;

      const avatarUrl = user.avatar
        ? "https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".png?size=160"
        : "https://cdn.discordapp.com/embed/avatars/0.png";

      const img = document.getElementById("avatar");
      img.src = avatarUrl;
      img.alt = user.global_name || user.username;
      img.classList.remove("skel");

      const displayName = user.global_name || user.username;
      document.getElementById("displayName").textContent = displayName;
      document.getElementById("handle").textContent = "@" + user.username;

      const status = data.discord_status || "offline";
      const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
      document.getElementById("statusDot").style.background = color;
      document.getElementById("statusDotInline").style.background = color;
      document.getElementById("statusText").textContent = STATUS_LABELS[status] || status;

      activityLine(data);
    })
    .catch(() => {
      document.getElementById("displayName").textContent = "rafmcccc";
      document.getElementById("statusText").textContent = "Status unavailable";
    });
}

function loadRepos(){
  const list = document.getElementById("repoList");
  fetch("https://api.github.com/users/" + GITHUB_USER + "/repos?sort=updated&per_page=100")
    .then((r) => {
      if (!r.ok) throw new Error("github error");
      return r.json();
    })
    .then((repos) => {
      const filtered = repos.filter((r) => !r.private && !r.fork);
      if (!filtered.length) {
        list.innerHTML = '<div class="placeholder">No public repos found.</div>';
        return;
      }
      list.innerHTML = filtered.map((r) =>
        '<a class="repo-card" href="' + r.html_url + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="repo-main">' +
            '<div class="repo-name">' + escapeHtml(r.name) + '</div>' +
            (r.description ? '<div class="repo-desc">' + escapeHtml(r.description) + '</div>' : '') +
          '</div>' +
          '<div class="repo-meta">' +
            (r.language ? '<span class="lang"><span class="lang-dot"></span>' + escapeHtml(r.language) + '</span>' : '') +
            '<span>★ ' + r.stargazers_count + '</span>' +
            '<span class="arrow">→</span>' +
          '</div>' +
        '</a>'
      ).join("");
    })
    .catch(() => {
      list.innerHTML = '<div class="placeholder">Could not load repos — ' +
        '<a href="https://github.com/' + GITHUB_USER + '" target="_blank" rel="noopener noreferrer">view on GitHub →</a></div>';
    });
}

function startPolling(){
  discordInterval = setInterval(loadDiscord, 20000);
  repoInterval = setInterval(loadRepos, 300000);
}

function stopPolling(){
  clearInterval(discordInterval);
  clearInterval(repoInterval);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopPolling();
  } else {
    loadDiscord();
    loadRepos();
    startPolling();
  }
});

loadDiscord();
loadRepos();
startPolling();
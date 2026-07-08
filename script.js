(function(){
  var DISCORD_ID = "1217443106069155841";
  var GITHUB_USER = "rafmcccc";

  var STATUS_COLORS = {
    online: "var(--online)",
    idle: "var(--idle)",
    dnd: "var(--dnd)",
    offline: "var(--offline)"
  };
  var STATUS_LABELS = {
    online: "Online",
    idle: "Idle",
    dnd: "Do not disturb",
    offline: "Offline"
  };

  function clock(){
    var d = new Date();
    var pad = function(n){ return n.toString().padStart(2,"0"); };
    document.getElementById("clock").textContent =
      pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }
  clock();
  setInterval(clock, 1000);

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function activityLine(data){
    var box = document.getElementById("activity");
    var lines = [];

    var spotify = data.spotify;
    if (spotify) {
      lines.push('<div><span class="k">Listening: </span>' +
        escapeHtml(spotify.song) + " — " + escapeHtml(spotify.artist) + "</div>");
    }

    var acts = (data.activities || []).filter(function(a){
      return a.type === 0 && a.name !== "Spotify";
    });
    if (acts.length) {
      var a = acts[0];
      var line = escapeHtml(a.name);
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

  function loadDiscord(){
    fetch("https://api.lanyard.rest/v1/users/" + DISCORD_ID)
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (!res.success) throw new Error("lanyard error");
        var data = res.data;
        var user = data.discord_user;

        var avatarUrl = user.avatar
          ? "https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".png?size=160"
          : "https://cdn.discordapp.com/embed/avatars/0.png";

        var img = document.getElementById("avatar");
        img.src = avatarUrl;
        img.alt = user.global_name || user.username;
        img.classList.remove("skel");

        var displayName = user.global_name || user.username;
        document.getElementById("displayName").textContent = displayName;
        document.getElementById("handle").textContent = "@" + user.username;

        var status = data.discord_status || "offline";
        var color = STATUS_COLORS[status] || STATUS_COLORS.offline;
        document.getElementById("statusDot").style.background = color;
        document.getElementById("statusDotInline").style.background = color;
        document.getElementById("statusText").textContent = STATUS_LABELS[status] || status;

        activityLine(data);
      })
      .catch(function(){
        document.getElementById("displayName").textContent = "rafmcccc";
        document.getElementById("statusText").textContent = "Status unavailable";
      });
  }

  function loadRepos(){
    var list = document.getElementById("repoList");
    fetch("https://api.github.com/users/" + GITHUB_USER + "/repos?sort=updated&per_page=100")
      .then(function(r){
        if (!r.ok) throw new Error("github error");
        return r.json();
      })
      .then(function(repos){
        repos = repos.filter(function(r){ return !r.private && !r.fork; });
        if (!repos.length) {
          list.innerHTML = '<div class="placeholder">No public repos found.</div>';
          return;
        }
        list.innerHTML = repos.map(function(r){
          return '<a class="repo-card" href="' + r.html_url + '" target="_blank" rel="noopener noreferrer">' +
            '<div class="repo-main">' +
              '<div class="repo-name">' + escapeHtml(r.name) + '</div>' +
              (r.description ? '<div class="repo-desc">' + escapeHtml(r.description) + '</div>' : '') +
            '</div>' +
            '<div class="repo-meta">' +
              (r.language ? '<span class="lang"><span class="lang-dot"></span>' + escapeHtml(r.language) + '</span>' : '') +
              '<span>★ ' + r.stargazers_count + '</span>' +
              '<span class="arrow">→</span>' +
            '</div>' +
          '</a>';
        }).join("");
      })
      .catch(function(){
        list.innerHTML = '<div class="placeholder">Could not load repos — ' +
          '<a href="https://github.com/' + GITHUB_USER + '" target="_blank" rel="noopener noreferrer">view on GitHub →</a></div>';
      });
  }

  loadDiscord();
  loadRepos();
  setInterval(loadDiscord, 20000);
})();
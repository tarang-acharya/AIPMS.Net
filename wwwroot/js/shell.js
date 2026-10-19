// shell.js — renders the sidebar/topbar shell shared by all authenticated views.

const NAV_BY_ROLE = {
  student: [
    { path: "#/student/dashboard", label: "Dashboard" },
    { path: "#/student/profile", label: "My Profile" },
    { path: "#/student/resume", label: "Resume & AI Analysis" },
    { path: "#/student/jobs", label: "Browse Jobs" },
    { path: "#/student/recommendations", label: "AI Recommendations" },
    { path: "#/student/applications", label: "My Applications" },
    { path: "#/student/queries", label: "Ask TPO" },
    { path: "#/student/notifications", label: "Notifications" },
  ],
  recruiter: [
    { path: "#/recruiter/dashboard", label: "Dashboard" },
    { path: "#/recruiter/post-job", label: "Post a Job" },
    { path: "#/recruiter/jobs", label: "My Postings" },
    { path: "#/recruiter/notifications", label: "Notifications" },
  ],
  tpo: [
    { path: "#/tpo/dashboard", label: "Reports & Stats" },
    { path: "#/tpo/recruiters", label: "Recruiter Approvals" },
    { path: "#/tpo/companies", label: "Companies & Jobs" },
    { path: "#/tpo/students", label: "Student Records" },
    { path: "#/tpo/drives", label: "Placement Drives" },
    { path: "#/tpo/departments", label: "Departments" },
    { path: "#/tpo/announcements", label: "Announcements" },
    { path: "#/tpo/messages", label: "Message Students" },
    { path: "#/tpo/queries", label: "Student Queries" },
    { path: "#/tpo/notifications", label: "Notifications" },
  ],
  admin: [
    { path: "#/admin/users", label: "User Accounts" },
    { path: "#/admin/audit-logs", label: "Audit Logs" },
    { path: "#/admin/stats", label: "System Stats" },
  ],
};

const ROLE_LABEL = { student: "Student", recruiter: "Recruiter", tpo: "TPO", admin: "Administrator" };

function renderShell(activePath, title, subtitle, bodyHtml) {
  const user = Auth.getUser();
  const nav = NAV_BY_ROLE[user.role] || [];

  app.innerHTML = `
    <div class="topbar">
      <div class="brand">${logoMarkup(30)}AIPMS</div>
      <div class="topbar-right">
        <span class="role-chip">${ROLE_LABEL[user.role]}</span>
        <span class="muted" style="font-size:13.5px;">${escapeHtml(user.email)}</span>
        <button class="btn btn-ghost btn-sm" id="logoutBtn">Sign out</button>
      </div>
    </div>
    <div class="layout">
      <div class="sidebar">
        <div class="nav-section-label">Menu</div>
        ${nav.map((n) => `
          <div class="nav-item ${n.path === activePath ? "active" : ""}" data-path="${n.path}">
            <span class="dot"></span>${n.label}
          </div>`).join("")}
      </div>
      <div class="main">
        <div class="page-header">
          <div class="eyebrow">${ROLE_LABEL[user.role]} Module</div>
          <h1>${title}</h1>
          ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
        <div id="pageBody">${bodyHtml || ""}</div>
      </div>
    </div>`;

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => (window.location.hash = item.dataset.path));
  });

  checkForNewNotifications();
}

function setBody(html) {
  const el = document.getElementById("pageBody");
  if (el) el.innerHTML = html;
}

// ---------------------------------------------------------------
// "New notification" popup — checked once per shell render. Shows a
// clickable toast the first time a not-yet-announced notification is
// seen, and updates an unread-count badge on the Notifications nav item.
// ---------------------------------------------------------------
const NOTIF_ROUTE_BY_ROLE = {
  student: "#/student/notifications",
  recruiter: "#/recruiter/notifications",
  tpo: "#/tpo/notifications",
  admin: null,
};

async function checkForNewNotifications() {
  const user = Auth.getUser();
  if (!user) return;
  const notifRoute = NOTIF_ROUTE_BY_ROLE[user.role];
  try {
    const notifs = await api.get("/notifications");
    const unread = notifs.filter((n) => !n.is_read);

    // Badge the nav item with the unread count.
    if (notifRoute) {
      const navItem = document.querySelector(`.nav-item[data-path="${notifRoute}"]`);
      if (navItem && !navItem.querySelector(".nav-badge")) {
        if (unread.length) {
          const badge = document.createElement("span");
          badge.className = "nav-badge";
          badge.textContent = unread.length;
          navItem.appendChild(badge);
        }
      }
    }

    if (!unread.length || !notifRoute) return;
    const key = `aipms_last_popup_id_${user.id}`;
    const lastPopupId = Number(localStorage.getItem(key) || 0);
    const newest = unread[0]; // notifications are ordered newest-first
    if (newest.id > lastPopupId) {
      showNotificationPopup(newest, notifRoute);
      localStorage.setItem(key, String(newest.id));
    }
  } catch { /* silent — notification popup is a non-critical enhancement */ }
}

function showNotificationPopup(notif, notifRoute) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = "toast notif-toast";
  t.innerHTML = `<strong>🔔 New notification</strong><div style="margin-top:3px;font-weight:400;font-size:12.5px;opacity:0.9;">${escapeHtml(notif.message)}</div>`;
  t.addEventListener("click", () => {
    window.location.hash = notifRoute;
    t.remove();
  });
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 8000);
}

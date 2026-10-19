// admin.js — System Administrator module views.

route("/admin/users", renderAdminUsers);
route("/admin/audit-logs", renderAdminAuditLogs);
route("/admin/stats", renderAdminStats);

async function renderAdminUsers() {
  renderShell("#/admin/users", "User Accounts", "All accounts across every role.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const users = await api.get("/admin/users");
    setBody(`
      <div class="card" style="max-width:520px;margin-bottom:18px;">
        <h3>Create TPO / Admin Account</h3>
        <form id="createUserForm" class="form-row">
          <div class="field"><label>Email</label><input type="email" name="email" required /></div>
          <div class="field"><label>Password</label><input type="password" name="password" required minlength="6" /></div>
          <div class="field" style="max-width:130px;"><label>Role</label><select name="role"><option value="tpo">TPO</option><option value="admin">Admin</option></select></div>
          <div class="field" style="max-width:100px;align-self:flex-end;"><button class="btn btn-primary" style="width:100%;" type="submit">Add</button></div>
        </form>
      </div>
      <div class="card"><table class="ledger">
        <thead><tr><th>Email</th><th>Role</th><th>Approved</th><th>Status</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          ${users.map((u) => `
            <tr>
              <td>${escapeHtml(u.email)}</td>
              <td><span class="role-chip">${escapeHtml(u.role)}</span></td>
              <td>${u.is_approved ? "Yes" : `<button class="btn btn-ghost btn-sm approve-btn" data-id="${u.id}">Approve</button>`}</td>
              <td>${u.is_active ? `<span class="seal-badge selected">Active</span>` : `<span class="seal-badge rejected">Inactive</span>`}</td>
              <td>${fmtDate(u.created_at)}</td>
              <td><button class="btn btn-ghost btn-sm toggle-btn" data-id="${u.id}">${u.is_active ? "Deactivate" : "Activate"}</button></td>
            </tr>`).join("")}
        </tbody>
      </table></div>
    `);
    document.getElementById("createUserForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await guarded(async () => {
        await api.post("/admin/users", { email: fd.get("email"), password: fd.get("password"), role: fd.get("role") });
        toast("Account created", "success");
        renderAdminUsers();
      });
    });
    document.querySelectorAll(".toggle-btn").forEach((b) => b.addEventListener("click", async () => {
      await guarded(async () => { await api.put(`/admin/users/${b.dataset.id}/toggle-active`); renderAdminUsers(); });
    }));
    document.querySelectorAll(".approve-btn").forEach((b) => b.addEventListener("click", async () => {
      await guarded(async () => { await api.put(`/admin/users/${b.dataset.id}/approve`); renderAdminUsers(); });
    }));
  });
}

async function renderAdminAuditLogs() {
  renderShell("#/admin/audit-logs", "Audit Logs", "Recent authentication and system activity.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const logs = await api.get("/admin/audit-logs");
    setBody(`
      <div class="card"><table class="ledger">
        <thead><tr><th>User</th><th>Action</th><th>When</th></tr></thead>
        <tbody>
          ${logs.length ? logs.map((l) => `
            <tr><td>${escapeHtml(l.email || "—")}</td><td>${escapeHtml(l.action)}</td><td>${fmtDateTime(l.created_at)}</td></tr>
          `).join("") : `<tr><td colspan="3" class="muted">No activity logged yet.</td></tr>`}
        </tbody>
      </table></div>
    `);
  });
}

async function renderAdminStats() {
  renderShell("#/admin/stats", "System Stats", "Row counts across core tables — a quick health check.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const stats = await api.get("/admin/system-stats");
    setBody(`
      <div class="grid cols-4">
        ${Object.entries(stats).map(([k, v]) => `
          <div class="stat-card"><div class="value">${v}</div><div class="label">${escapeHtml(k)}</div></div>
        `).join("")}
      </div>
    `);
  });
}

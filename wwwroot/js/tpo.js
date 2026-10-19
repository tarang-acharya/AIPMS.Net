// tpo.js — Training & Placement Officer module views.

route("/tpo/dashboard", renderTpoDashboard);
route("/tpo/recruiters", renderTpoRecruiters);
route("/tpo/students", renderTpoStudents);
route("/tpo/drives", renderTpoDrives);
route("/tpo/departments", renderTpoDepartments);
route("/tpo/announcements", renderTpoAnnouncements);
route("/tpo/companies", renderTpoCompanies);
route("/tpo/messages", renderTpoMessages);
route("/tpo/queries", renderTpoQueries);
route("/tpo/notifications", renderTpoNotifications);

async function renderTpoDashboard() {
  renderShell("#/tpo/dashboard", "Reports & Stats", "Institution-wide placement performance.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const r = await api.get("/tpo/reports");
    setBody(`
      <div class="grid cols-4" style="margin-bottom:18px;">
        <div class="stat-card"><div class="value">${r.totalStudents}</div><div class="label">Students</div></div>
        <div class="stat-card"><div class="value">${r.totalRecruiters}</div><div class="label">Recruiters</div></div>
        <div class="stat-card"><div class="value">${r.totalJobs}</div><div class="label">Job Postings</div></div>
        <div class="stat-card"><div class="value">${r.placementRate}%</div><div class="label">Placement Rate</div></div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <h3>Applications by Status</h3>
          ${r.byStatus.length ? r.byStatus.map((s) => `
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                <span>${escapeHtml(s.status)}</span><span class="muted">${s.c}</span>
              </div>
              <div class="progress"><div style="width:${Math.min(100, (s.c / Math.max(1, r.totalApplications)) * 100)}%"></div></div>
            </div>`).join("") : `<p class="muted" style="font-size:13.5px;">No applications recorded yet.</p>`}
        </div>
        <div class="card">
          <h3>Placements by Department</h3>
          ${r.byDepartment.filter(d => d.department).length ? r.byDepartment.filter(d => d.department).map((d) => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--paper-line);font-size:13.5px;">
              <span>${escapeHtml(d.department)}</span><strong>${d.placedCount}</strong>
            </div>`).join("") : `<p class="muted" style="font-size:13.5px;">No department-wise placements yet.</p>`}
        </div>
      </div>
      <div class="grid cols-2" style="margin-top:18px;">
        <div class="card">
          <h3>Top Hiring Companies</h3>
          ${r.topCompanies.length ? r.topCompanies.map((c) => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--paper-line);font-size:13.5px;">
              <span>${escapeHtml(c.name || "—")}</span><strong>${c.hires}</strong>
            </div>`).join("") : `<p class="muted" style="font-size:13.5px;">No hires recorded yet.</p>`}
        </div>
        <div class="card">
          <h3>AI Resume Quality</h3>
          <div style="display:flex;align-items:center;gap:20px;">
            <div class="ats-score-ring" style="--pct:${r.avgAtsScore || 0}"><span>${r.avgAtsScore ?? "—"}</span></div>
            <p class="muted" style="font-size:13px;">Average ATS score across all uploaded resumes on the platform.</p>
          </div>
        </div>
      </div>
    `);
  });
}

async function renderTpoRecruiters() {
  renderShell("#/tpo/recruiters", "Recruiter Approvals", "Verify companies before they can post jobs on the platform.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const pending = await api.get("/tpo/pending-recruiters");
    setBody(`
      ${pending.length ? pending.map((p) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
            <div>
              <h3 style="margin-bottom:2px;">${escapeHtml(p.companyName || "Unnamed Company")}</h3>
              <div class="muted" style="font-size:13px;">${escapeHtml(p.companyIndustry || "Industry not specified")} · ${escapeHtml(p.companyLocation || "Location not specified")}</div>
              ${p.companyWebsite ? `<div style="font-size:13px;margin-top:4px;"><a href="${escapeHtml(p.companyWebsite)}" target="_blank" rel="noopener" style="color:var(--brass);">${escapeHtml(p.companyWebsite)}</a></div>` : ""}
              ${p.companyDescription ? `<p style="font-size:13.5px;margin:10px 0 0;color:var(--ink-soft);">${escapeHtml(p.companyDescription)}</p>` : ""}
              <div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--paper-line);">
                <div class="eyebrow" style="margin-bottom:4px;">Recruiter Contact</div>
                <div style="font-size:13.5px;">${escapeHtml(p.full_name)} ${p.designation ? `· ${escapeHtml(p.designation)}` : ""}</div>
                <div class="muted" style="font-size:13px;">${escapeHtml(p.email)}${p.phone ? ` · ${escapeHtml(p.phone)}` : ""}</div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;min-width:120px;">
              <button class="btn btn-primary btn-sm approve-btn" data-id="${p.id}">Approve</button>
              <button class="btn btn-danger btn-sm reject-btn" data-id="${p.id}">Reject</button>
            </div>
          </div>
        </div>
      `).join("") : `<div class="empty-state"><div class="glyph">✅</div>No pending recruiter approvals.</div>`}
    `);
    document.querySelectorAll(".approve-btn").forEach((b) => b.addEventListener("click", async () => {
      await guarded(async () => { await api.post(`/tpo/recruiters/${b.dataset.id}/approve`); toast("Recruiter and company approved", "success"); renderTpoRecruiters(); });
    }));
    document.querySelectorAll(".reject-btn").forEach((b) => b.addEventListener("click", async () => {
      await guarded(async () => { await api.post(`/tpo/recruiters/${b.dataset.id}/reject`); toast("Recruiter rejected", "success"); renderTpoRecruiters(); });
    }));
  });
}

async function renderTpoStudents() {
  renderShell("#/tpo/students", "Student Records", "All registered students across departments.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const students = await api.get("/tpo/students");
    setBody(`
      <div class="card"><table class="ledger">
        <thead><tr><th>Name</th><th>Enrollment</th><th>Department</th><th>CGPA</th><th>Email</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${students.map((s) => `
            <tr>
              <td>${escapeHtml(s.full_name)}</td>
              <td>${escapeHtml(s.enrollment_no || "—")}</td>
              <td>${escapeHtml(s.department || "—")}</td>
              <td>${s.cgpa ?? "—"}</td>
              <td>${escapeHtml(s.email)}</td>
              <td>${s.is_active ? `<span class="seal-badge selected">Active</span>` : `<span class="seal-badge rejected">Inactive</span>`}</td>
              <td><button class="btn btn-ghost btn-sm toggle-btn" data-id="${s.id}">${s.is_active ? "Deactivate" : "Activate"}</button></td>
            </tr>`).join("")}
        </tbody>
      </table></div>
    `);
    document.querySelectorAll(".toggle-btn").forEach((b) => b.addEventListener("click", async () => {
      await guarded(async () => { await api.put(`/tpo/students/${b.dataset.id}/toggle-active`); renderTpoStudents(); });
    }));
  });
}

async function renderTpoDrives() {
  renderShell("#/tpo/drives", "Placement Drives", "Schedule and track campus placement drives.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const [drives, companies] = await Promise.all([api.get("/tpo/drives"), api.get("/public/companies")]);
    setBody(`
      <div class="card" style="max-width:640px;margin-bottom:18px;">
        <h3>Schedule a Drive</h3>
        <form id="driveForm">
          <div class="form-row">
            <div class="field"><label>Title</label><input name="title" required placeholder="e.g. TechNova Campus Drive" /></div>
            <div class="field"><label>Date</label><input type="date" name="driveDate" /></div>
          </div>
          <div class="field"><label>Company</label>
            <select name="companyId"><option value="">—</option>${companies.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}</select>
          </div>
          <div class="field"><label>Description</label><textarea name="description"></textarea></div>
          <button class="btn btn-primary" type="submit">Create drive</button>
        </form>
      </div>
      <div class="card"><table class="ledger">
        <thead><tr><th>Title</th><th>Company</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${drives.length ? drives.map((d) => `
            <tr>
              <td>${escapeHtml(d.title)}</td>
              <td>${escapeHtml(d.companyName || "—")}</td>
              <td>${fmtDate(d.drive_date)}</td>
              <td>
                <select class="status-sel" data-id="${d.id}">
                  ${["Upcoming","Ongoing","Completed","Cancelled"].map((s) => `<option value="${s}" ${s === d.status ? "selected" : ""}>${s}</option>`).join("")}
                </select>
              </td>
            </tr>`).join("") : `<tr><td colspan="4" class="muted">No drives scheduled yet.</td></tr>`}
        </tbody>
      </table></div>
    `);
    document.getElementById("driveForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await guarded(async () => {
        await api.post("/tpo/drives", {
          title: fd.get("title"), companyId: fd.get("companyId") ? Number(fd.get("companyId")) : null,
          driveDate: fd.get("driveDate") || null, description: fd.get("description"),
        });
        toast("Drive created", "success");
        renderTpoDrives();
      });
    });
    document.querySelectorAll(".status-sel").forEach((sel) => sel.addEventListener("change", async () => {
      await guarded(async () => { await api.put(`/tpo/drives/${sel.dataset.id}/status`, { status: sel.value }); toast("Status updated", "success"); });
    }));
  });
}

async function renderTpoDepartments() {
  renderShell("#/tpo/departments", "Departments", "Manage academic departments and the courses running under each.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const depts = await api.get("/tpo/departments");
    setBody(`
      <div class="card" style="max-width:480px;margin-bottom:18px;">
        <h3>Add Department</h3>
        <form id="deptForm">
          <div class="field"><label>Department name</label><input name="name" placeholder="e.g. Artificial Intelligence" required /></div>
          <div class="field">
            <label>Related courses (comma-separated)</label>
            <input name="courses" placeholder="e.g. B.Tech AI, M.Tech AI" />
            <div class="hint">Optional — you can also add courses one at a time below after creating the department.</div>
          </div>
          <button class="btn btn-primary btn-sm" type="submit">Add Department</button>
        </form>
      </div>
      ${depts.map((d) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <h3 style="margin-bottom:6px;">${escapeHtml(d.name)}</h3>
          </div>
          <div style="margin-bottom:10px;">
            ${d.courses.length ? d.courses.map((c) => `<span class="tag">${escapeHtml(c.name)} <a href="#" class="remove-course" data-id="${c.id}" style="color:var(--rust);text-decoration:none;margin-left:4px;">×</a></span>`).join("") : `<span class="muted" style="font-size:13px;">No courses added yet.</span>`}
          </div>
          <form class="course-form" data-dept="${d.id}" style="display:flex;gap:8px;max-width:360px;">
            <input name="course" placeholder="Add a course…" style="flex:1;padding:8px 10px;border:1px solid var(--paper-line);border-radius:8px;font-size:13px;" />
            <button class="btn btn-ghost btn-sm" type="submit">Add</button>
          </form>
        </div>
      `).join("")}
    `);

    document.getElementById("deptForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const courses = (fd.get("courses") || "").split(",").map((c) => c.trim()).filter(Boolean);
      await guarded(async () => {
        await api.post("/tpo/departments", { name: fd.get("name"), courses });
        toast("Department added", "success");
        renderTpoDepartments();
      });
    });
    document.querySelectorAll(".course-form").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const name = fd.get("course");
        if (!name?.trim()) return;
        await guarded(async () => {
          await api.post(`/tpo/departments/${form.dataset.dept}/courses`, { name });
          renderTpoDepartments();
        });
      });
    });
    document.querySelectorAll(".remove-course").forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        await guarded(async () => {
          await fetch(`/api/tpo/courses/${a.dataset.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${Auth.getToken()}` } });
          renderTpoDepartments();
        });
      });
    });
  });
}

async function renderTpoAnnouncements() {
  renderShell("#/tpo/announcements", "Announcements", "Broadcast a notification to every student.", `
    <div class="card" style="max-width:560px;">
      <form id="annForm">
        <div class="field"><label>Message</label><textarea name="message" required placeholder="e.g. Placement drive for TechNova on 15th Sept — submit updated resumes by 10th."></textarea></div>
        <button class="btn btn-primary" type="submit">Send to all students</button>
      </form>
    </div>
  `);
  document.getElementById("annForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await guarded(async () => {
      const res = await api.post("/tpo/announcements", { message: fd.get("message") });
      toast(`Sent to ${res.recipients} student(s)`, "success");
      e.target.reset();
    });
  });
}

async function renderTpoCompanies() {
  renderShell("#/tpo/companies", "Companies & Jobs", "Every registered company with their open positions, locations, and offers issued.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const companies = await api.get("/tpo/companies");
    setBody(`
      ${companies.length ? companies.map((c) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <h3 style="margin-bottom:2px;">${escapeHtml(c.name)} ${c.is_verified ? `<span class="seal-badge selected" style="margin-left:6px;">Verified</span>` : `<span class="seal-badge applied" style="margin-left:6px;">Unverified</span>`}</h3>
              <div class="muted" style="font-size:13px;">${escapeHtml(c.industry || "—")} · ${escapeHtml(c.location || "—")}</div>
            </div>
          </div>
          ${c.description ? `<p style="font-size:13.5px;margin:10px 0;color:var(--ink-soft);">${escapeHtml(c.description)}</p>` : ""}
          ${c.jobs.length ? `
            <table class="ledger" style="margin-top:10px;">
              <thead><tr><th>Position</th><th>Type</th><th>Location</th><th>Package</th><th>Applicants</th><th>Offers</th><th>Status</th></tr></thead>
              <tbody>
                ${c.jobs.map((j) => `
                  <tr>
                    <td>${escapeHtml(j.title)}</td>
                    <td>${escapeHtml(j.jobType)}</td>
                    <td>${escapeHtml(j.location || "—")}</td>
                    <td>${fmtMoney(j.salaryPackage)}</td>
                    <td>${j.applicantCount}</td>
                    <td>${j.offersIssued}</td>
                    <td>${j.isActive ? `<span class="seal-badge selected">Open</span>` : `<span class="seal-badge rejected">Closed</span>`}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : `<p class="muted" style="font-size:13px;margin-top:8px;">No jobs posted by this company yet.</p>`}
        </div>
      `).join("") : `<div class="empty-state"><div class="glyph">🏢</div>No companies registered yet.</div>`}
    `);
  });
}

async function renderTpoMessages() {
  renderShell("#/tpo/messages", "Message Students", "Send a personal message to one or more specific students.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const [students, sent] = await Promise.all([api.get("/tpo/students"), api.get("/tpo/messages")]);
    setBody(`
      <div class="card" style="max-width:640px;margin-bottom:18px;">
        <h3>New Message</h3>
        <form id="msgForm">
          <div class="field">
            <label>Recipients</label>
            <div style="max-height:180px;overflow-y:auto;border:1px solid var(--paper-line);border-radius:8px;padding:10px;">
              ${students.map((s) => `
                <label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13.5px;font-weight:400;">
                  <input type="checkbox" name="studentIds" value="${s.id}" style="width:auto;" />
                  ${escapeHtml(s.full_name)} <span class="muted">(${escapeHtml(s.enrollment_no || s.email)})</span>
                </label>
              `).join("")}
            </div>
          </div>
          <div class="field"><label>Subject (optional)</label><input name="subject" placeholder="e.g. Interview reminder" /></div>
          <div class="field"><label>Message</label><textarea name="message" required></textarea></div>
          <button class="btn btn-primary" type="submit">Send Message</button>
        </form>
      </div>
      <h3 style="font-family:var(--font-display);font-weight:600;margin-bottom:12px;">Recently Sent</h3>
      ${sent.length ? sent.map((m) => `
        <div class="card">
          <strong style="font-size:13.5px;">${escapeHtml(m.subject || "Message")}</strong>
          <div class="muted" style="font-size:12px;margin:2px 0 8px;">${fmtDateTime(m.created_at)} · To: ${m.recipients.map(escapeHtml).join(", ")}</div>
          <p style="font-size:13.5px;margin:0;white-space:pre-wrap;">${escapeHtml(m.message)}</p>
        </div>
      `).join("") : `<div class="empty-state"><div class="glyph">✉️</div>No personal messages sent yet.</div>`}
    `);

    document.getElementById("msgForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const studentIds = fd.getAll("studentIds").map(Number);
      if (!studentIds.length) return toast("Select at least one student", "error");
      await guarded(async () => {
        const res = await api.post("/tpo/messages", { studentIds, subject: fd.get("subject"), message: fd.get("message") });
        toast(`Sent to ${res.recipients} student(s)`, "success");
        renderTpoMessages();
      });
    });
  });
}

async function renderTpoQueries() {
  renderShell("#/tpo/queries", "Student Queries", "Questions and requests raised by students.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const queries = await api.get("/tpo/queries");
    setBody(`
      ${queries.length ? queries.map((q) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <strong style="font-size:13.5px;">${escapeHtml(q.subject || "General query")}</strong>
              <div class="muted" style="font-size:12px;margin-top:2px;">${escapeHtml(q.full_name)} (${escapeHtml(q.enrollment_no || q.email)}) · ${fmtDateTime(q.created_at)}</div>
            </div>
            <span class="seal-badge ${q.status === "Resolved" ? "selected" : "applied"}">${escapeHtml(q.status)}</span>
          </div>
          <p style="font-size:13.5px;margin:10px 0;white-space:pre-wrap;">${escapeHtml(q.message)}</p>
          ${q.reply ? `
            <div style="padding-top:10px;border-top:1px dashed var(--paper-line);">
              <div class="eyebrow" style="margin-bottom:4px;">Your Reply · ${fmtDateTime(q.replied_at)}</div>
              <p style="font-size:13.5px;margin:0;white-space:pre-wrap;">${escapeHtml(q.reply)}</p>
            </div>
          ` : `
            <form class="reply-form" data-id="${q.id}" style="margin-top:8px;">
              <textarea name="reply" placeholder="Write a reply…" required rows="2" style="width:100%;padding:8px 10px;border:1px solid var(--paper-line);border-radius:8px;font-size:13px;font-family:inherit;"></textarea>
              <button class="btn btn-primary btn-sm" type="submit" style="margin-top:6px;">Send Reply</button>
            </form>
          `}
        </div>
      `).join("") : `<div class="empty-state"><div class="glyph">💬</div>No student queries yet.</div>`}
    `);
    document.querySelectorAll(".reply-form").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await guarded(async () => {
          await api.post(`/tpo/queries/${form.dataset.id}/reply`, { reply: fd.get("reply") });
          toast("Reply sent", "success");
          renderTpoQueries();
        });
      });
    });
  });
}

async function renderTpoNotifications() {
  renderShell("#/tpo/notifications", "Notifications", "New student queries and placement activity.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const notifs = await api.get("/notifications");
    setBody(renderNotificationList(notifs));
    bindNotificationExpanders(renderTpoNotifications);
  });
}

// student.js — Student module views.

route("/student/dashboard", renderStudentDashboard);
route("/student/profile", renderStudentProfile);
route("/student/resume", renderStudentResume);
route("/student/jobs", renderStudentJobs);
route("/student/recommendations", renderStudentRecommendations);
route("/student/applications", renderStudentApplications);
route("/student/notifications", renderStudentNotifications);
route("/student/queries", renderStudentQueries);

async function renderStudentDashboard() {
  renderShell("#/student/dashboard", "Dashboard", "Your placement journey at a glance.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const [profile, apps, notifs] = await Promise.all([
      api.get("/students/me"),
      api.get("/students/applications"),
      api.get("/notifications"),
    ]);
    let analysis = null;
    try { analysis = await api.get("/students/resume/analysis"); } catch { /* no resume yet */ }

    const selected = apps.filter((a) => a.status === "Selected").length;
    const unread = notifs.filter((n) => !n.is_read).length;

    setBody(`
      <div class="grid cols-4" style="margin-bottom:18px;">
        <div class="stat-card"><div class="value">${analysis ? analysis.atsScore : "—"}</div><div class="label">ATS Score</div></div>
        <div class="stat-card"><div class="value">${apps.length}</div><div class="label">Applications</div></div>
        <div class="stat-card"><div class="value">${selected}</div><div class="label">Offers</div></div>
        <div class="stat-card"><div class="value">${unread}</div><div class="label">New Notifications</div></div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <h3>Profile Snapshot</h3>
          <p><strong>${escapeHtml(profile.full_name)}</strong> · ${escapeHtml(profile.department || "No department set")}</p>
          <p class="muted" style="font-size:13.5px;">Enrollment: ${escapeHtml(profile.enrollment_no || "—")} &nbsp;·&nbsp; CGPA: ${profile.cgpa ?? "—"}</p>
          <div style="margin-top:10px;">
            ${(profile.skills || []).slice(0, 8).map((s) => `<span class="tag">${escapeHtml(s.name)}</span>`).join("") || `<span class="muted" style="font-size:13px">No skills added yet.</span>`}
          </div>
          <a href="#/student/profile" class="btn btn-ghost btn-sm" style="margin-top:14px;">Edit profile →</a>
        </div>
        <div class="card">
          <h3>Recent Applications</h3>
          ${apps.slice(0, 4).map((a) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--paper-line);">
              <div><strong style="font-size:13.5px;">${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12px;">${escapeHtml(a.companyName || "—")}</div></div>
              <span class="seal-badge ${statusClass(a.status)}">${escapeHtml(a.status)}</span>
            </div>`).join("") || `<p class="muted" style="font-size:13.5px">No applications yet — browse open jobs to get started.</p>`}
          <a href="#/student/jobs" class="btn btn-ghost btn-sm" style="margin-top:14px;">Browse jobs →</a>
        </div>
      </div>
    `);
  });
}

async function renderStudentProfile() {
  renderShell("#/student/profile", "My Profile", "Keep your academic record and skills current.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const [profile, depts] = await Promise.all([api.get("/students/me"), api.get("/public/departments")]);
    setBody(`
      <div class="card" style="max-width:640px;">
        <h3>Academic Details</h3>
        <form id="profileForm">
          <div class="form-row">
            <div class="field"><label>Full name</label><input name="fullName" value="${escapeHtml(profile.full_name)}" /></div>
            <div class="field"><label>Phone</label><input name="phone" value="${escapeHtml(profile.phone || "")}" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Department</label>
              <select name="departmentId">
                <option value="">—</option>
                ${depts.map((d) => `<option value="${d.id}" ${d.id === profile.department_id ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label>CGPA</label><input type="number" step="0.01" min="0" max="10" name="cgpa" value="${profile.cgpa ?? ""}" /></div>
            <div class="field"><label>Passing Year</label><input type="number" name="passingYear" value="${profile.passing_year ?? ""}" /></div>
          </div>
          <div class="field"><label>Bio</label><textarea name="bio" placeholder="A short summary about you...">${escapeHtml(profile.bio || "")}</textarea></div>
          <div class="field">
            <label>Skills (comma-separated)</label>
            <input name="skills" value="${(profile.skills || []).map((s) => s.name).join(", ")}" placeholder="javascript, react, sql" />
            <div class="hint">These are also auto-detected whenever you upload a resume.</div>
          </div>
          <button class="btn btn-primary" type="submit">Save changes</button>
        </form>
      </div>
    `);

    document.getElementById("profileForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await guarded(async () => {
        await api.put("/students/me", {
          fullName: fd.get("fullName"),
          phone: fd.get("phone"),
          departmentId: fd.get("departmentId") ? Number(fd.get("departmentId")) : null,
          cgpa: fd.get("cgpa") ? Number(fd.get("cgpa")) : null,
          passingYear: fd.get("passingYear") ? Number(fd.get("passingYear")) : null,
          bio: fd.get("bio"),
          skillNames: fd.get("skills").split(",").map((s) => s.trim()).filter(Boolean),
        });
        toast("Profile updated", "success");
      });
    });
  });
}

async function renderStudentResume() {
  renderShell("#/student/resume", "Resume & AI Analysis", "Upload your resume to get an instant ATS score, skill extraction, and improvement tips.", `<div class="loading-line">Loading…</div>`);

  let analysis = null;
  try { analysis = await api.get("/students/resume/analysis"); } catch { /* none yet */ }

  setBody(`
    <div class="grid cols-2">
      <div class="card">
        <h3>Upload Resume</h3>
        <form id="resumeForm">
          <div class="field">
            <label>PDF or DOCX (max 5MB)</label>
            <input type="file" name="resume" accept=".pdf,.docx" required />
          </div>
          <button class="btn btn-brass" type="submit">Analyze with AI</button>
        </form>
        ${analysis ? `<p class="muted" style="font-size:12.5px;margin-top:12px;">Current file: ${escapeHtml(analysis.resume.filename)} · uploaded ${fmtDateTime(analysis.resume.uploadedAt)}</p>` : ""}
      </div>
      <div class="card" id="analysisCard">
        ${analysis ? renderAnalysisBlock(analysis) : `<div class="empty-state"><div class="glyph">📄</div>No resume analyzed yet.</div>`}
      </div>
    </div>
  `);

  document.getElementById("resumeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.textContent = "Analyzing…";
    await guarded(async () => {
      const result = await api.postForm("/students/resume", fd);
      toast("Resume analyzed", "success");
      document.getElementById("analysisCard").innerHTML = renderAnalysisBlock({
        atsScore: result.atsScore, extractedSkills: result.extractedSkills, suggestions: result.suggestions,
        resume: { filename: fd.get("resume").name, uploadedAt: new Date().toISOString() },
      });
    });
    btn.disabled = false; btn.textContent = "Analyze with AI";
  });
}

function renderAnalysisBlock(a) {
  return `
    <h3>AI Resume Analysis</h3>
    <div style="display:flex;align-items:center;gap:20px;">
      <div class="ats-score-ring" style="--pct:${a.atsScore}"><span>${a.atsScore}</span></div>
      <div>
        <div class="eyebrow">ATS Compatibility Score</div>
        <p class="muted" style="font-size:13px;max-width:260px;">Based on section coverage, skills, quantified impact, and action verbs.</p>
      </div>
    </div>
    <div style="margin-top:16px;">
      <strong style="font-size:13.5px;">Extracted Skills</strong>
      <div style="margin-top:8px;">
        ${a.extractedSkills.length ? a.extractedSkills.map((s) => `<span class="tag matched">${escapeHtml(s)}</span>`).join("") : `<span class="muted" style="font-size:13px">None detected — try a text-based PDF.</span>`}
      </div>
    </div>
    <div style="margin-top:16px;">
      <strong style="font-size:13.5px;">Improvement Suggestions</strong>
      <ul style="font-size:13.5px;color:var(--slate);padding-left:18px;margin-top:8px;">
        ${a.suggestions.length ? a.suggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join("") : "<li>Looks solid — no major issues detected.</li>"}
      </ul>
    </div>
  `;
}

async function renderStudentJobs() {
  renderShell("#/student/jobs", "Browse Jobs", "Search open internships and full-time roles.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    await loadAndRenderJobs();
  });

  async function loadAndRenderJobs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const jobs = await api.get(`/students/jobs${qs ? "?" + qs : ""}`);
    setBody(`
      <div class="card" style="margin-bottom:18px;">
        <form id="jobFilters" class="form-row" style="align-items:flex-end;">
          <div class="field"><label>Keyword</label><input name="q" placeholder="e.g. React, Data Analyst" value="${escapeHtml(params.q || "")}" /></div>
          <div class="field"><label>Type</label>
            <select name="type"><option value="">Any</option><option value="Internship">Internship</option><option value="Full-Time">Full-Time</option></select>
          </div>
          <div class="field"><label>Location</label><input name="location" placeholder="e.g. Bengaluru" value="${escapeHtml(params.location || "")}" /></div>
          <div class="field" style="max-width:140px;"><button class="btn btn-primary" type="submit" style="width:100%;">Search</button></div>
        </form>
      </div>
      <div id="jobList">${renderJobList(jobs)}</div>
    `);
    document.getElementById("jobFilters").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      guarded(() => loadAndRenderJobs({ q: fd.get("q"), type: fd.get("type"), location: fd.get("location") }));
    });
    bindApplyButtons();
  }
}

function renderJobList(jobs) {
  if (!jobs.length) return `<div class="empty-state"><div class="glyph">🔍</div>No jobs match your search right now.</div>`;
  return jobs.map((j) => `
    <div class="job-card">
      <div class="job-top">
        <div>
          <h4>${escapeHtml(j.title)}</h4>
          <div class="company">${escapeHtml(j.companyName || "Company")} · ${escapeHtml(j.job_type)}</div>
        </div>
        <button class="btn btn-brass btn-sm apply-btn" data-job="${j.id}">Apply</button>
      </div>
      <p class="muted" style="font-size:13.5px;margin:10px 0;">${escapeHtml((j.description || "").slice(0, 180))}${(j.description || "").length > 180 ? "…" : ""}</p>
      <div class="meta">
        <span>📍 ${escapeHtml(j.location || "—")}</span>
        <span>💰 ${fmtMoney(j.salary_package)}</span>
        <span>🎯 Min CGPA ${j.min_cgpa ?? 0}</span>
        <span>⏳ Deadline ${fmtDate(j.deadline)}</span>
      </div>
      ${j.required_skills ? `<div style="margin-top:10px;">${j.required_skills.split(",").map((s) => `<span class="tag">${escapeHtml(s.trim())}</span>`).join("")}</div>` : ""}
    </div>
  `).join("");
}

function bindApplyButtons() {
  document.querySelectorAll(".apply-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      await guarded(async () => {
        const res = await api.post(`/students/apply/${btn.dataset.job}`);
        toast(res.message, "success");
        btn.textContent = "Applied ✓";
      });
      if (btn.textContent !== "Applied ✓") btn.disabled = false;
    });
  });
}

async function renderStudentRecommendations() {
  renderShell("#/student/recommendations", "AI Recommendations", "Jobs ranked by how well your skill profile matches each role.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const jobs = await api.get("/students/recommendations");
    setBody(`
      <div id="jobList">
        ${jobs.length ? jobs.map((j) => `
          <div class="job-card">
            <div class="job-top">
              <div>
                <h4>${escapeHtml(j.title)}</h4>
                <div class="company">${escapeHtml(j.companyName || "Company")} · ${escapeHtml(j.job_type)}</div>
              </div>
              <div style="text-align:right;">
                <span class="match-pill ${j.matchPct >= 70 ? "" : j.matchPct >= 40 ? "mid" : "low"}">${j.matchPct}% match</span><br/>
                <button class="btn btn-brass btn-sm apply-btn" data-job="${j.id}" style="margin-top:8px;">Apply</button>
              </div>
            </div>
            <div class="meta">
              <span>📍 ${escapeHtml(j.location || "—")}</span>
              <span>💰 ${fmtMoney(j.salary_package)}</span>
              <span>${j.eligible ? "✅ CGPA eligible" : "⚠️ Below min CGPA"}</span>
            </div>
            ${j.missingSkills && j.missingSkills.length ? `<div style="margin-top:10px;"><span class="muted" style="font-size:12px;">Missing skills:</span><br/>${j.missingSkills.map((s) => `<span class="tag missing">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
          </div>
        `).join("") : `<div class="empty-state"><div class="glyph">🤖</div>Add skills to your profile or upload a resume to get personalized recommendations.</div>`}
      </div>
    `);
    bindApplyButtons();
  });
}

async function renderStudentApplications() {
  renderShell("#/student/applications", "My Applications", "Track the status of every job you've applied to.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const apps = await api.get("/students/applications");
    const pendingOffers = apps.filter((a) => a.offer_id && a.offer_response === "Pending");

    setBody(`
      ${pendingOffers.length ? `
      <div class="card" style="border-color:var(--brass-light);margin-bottom:18px;">
        <h3>🎉 You have ${pendingOffers.length} offer${pendingOffers.length > 1 ? "s" : ""} awaiting your response</h3>
        ${pendingOffers.map((a) => `
          <div style="padding:12px 0;border-top:1px solid var(--paper-line);">
            <strong style="font-size:13.5px;">${escapeHtml(a.title)}</strong> — ${escapeHtml(a.companyName || "")}
            <div class="muted" style="font-size:12.5px;margin:4px 0 8px;">Package: ${fmtMoney(a.offer_package)} · Joining: ${fmtDate(a.joining_date)}</div>
            ${offerActionMarkup({ reference_id: a.offer_id })}
          </div>
        `).join("")}
      </div>` : ""}
      ${apps.length ? `
      <div class="card">
        <table class="ledger">
          <thead><tr><th>Role</th><th>Company</th><th>Applied</th><th>Interview</th><th>Status</th><th>Offer</th></tr></thead>
          <tbody>
            ${apps.map((a) => `
              <tr>
                <td><strong>${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12px">${escapeHtml(a.job_type)} · ${escapeHtml(a.location || "")}</div></td>
                <td>${escapeHtml(a.companyName || "—")}</td>
                <td>${fmtDate(a.applied_at)}</td>
                <td>${a.scheduled_at ? `${fmtDateTime(a.scheduled_at)} <span class="muted">(${escapeHtml(a.interview_mode || "")})</span>` : "—"}</td>
                <td><span class="seal-badge ${statusClass(a.status)}">${escapeHtml(a.status)}</span></td>
                <td>
                  ${a.offer_id ? `
                    <div class="muted" style="font-size:12px;">${fmtMoney(a.offer_package)}</div>
                    <span class="seal-badge ${offerResponseClass(a.offer_response)}">${escapeHtml(a.offer_response)}</span>
                  ` : "—"}
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>` : `<div class="empty-state"><div class="glyph">📭</div>You haven't applied to any jobs yet.</div>`}
    `);
    bindOfferActions(renderStudentApplications);
  });
}


async function renderStudentNotifications() {
  renderShell("#/student/notifications", "Notifications", "Updates about your applications and placement announcements.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const notifs = await api.get("/notifications");
    setBody(renderNotificationList(notifs));
    bindNotificationExpanders(renderStudentNotifications);
  });
}

function notifIcon(type) {
  return {
    offer: "🎉", interview: "🗓️", status_update: "📋", personal: "✉️",
    query_reply: "💬", announcement: "📣", new_application: "🧾", offer_response: "🤝", new_query: "❓",
  }[type] || "🔔";
}

function renderNotificationList(notifs) {
  if (!notifs.length) return `<div class="empty-state"><div class="glyph">🔔</div>No notifications yet.</div>`;
  return notifs.map((n) => `
    <div class="card notif-card ${n.is_read ? "read" : ""}" data-id="${n.id}">
      <div class="notif-row" data-toggle="${n.id}">
        <div class="notif-main">
          <span class="notif-icon">${notifIcon(n.type)}</span>
          <div>
            <div style="font-size:13.5px;font-weight:${n.is_read ? "500" : "700"};">${escapeHtml(n.message)}</div>
            <div class="muted" style="font-size:12px;margin-top:3px;">${fmtDateTime(n.created_at)}</div>
          </div>
        </div>
        <span class="notif-arrow" id="arrow-${n.id}">▾</span>
      </div>
      <div class="notif-detail hidden" id="detail-${n.id}">
        ${n.detail ? `<p style="font-size:13.5px;color:var(--ink-soft);margin:10px 0 4px;white-space:pre-wrap;">${escapeHtml(n.detail)}</p>` : `<p class="muted" style="font-size:13px;margin:10px 0 4px;">No additional details.</p>`}
        ${n.type === "offer" ? offerActionMarkup(n) : ""}
        ${!n.is_read ? `<button class="btn btn-ghost btn-sm mark-read" data-id="${n.id}" style="margin-top:8px;">Mark read</button>` : ""}
      </div>
    </div>
  `).join("");
}

function offerActionMarkup(n) {
  return `
    <div class="offer-actions" data-offer="${n.reference_id}">
      <textarea class="offer-msg" placeholder="Optional note (e.g. negotiation ask, question)…" rows="2"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm offer-respond" data-response="Accepted">Accept Offer</button>
        <button class="btn btn-brass btn-sm offer-respond" data-response="Negotiating">Negotiate</button>
        <button class="btn btn-danger btn-sm offer-respond" data-response="Rejected">Reject</button>
      </div>
    </div>
  `;
}

function bindNotificationExpanders(refreshFn) {
  document.querySelectorAll("[data-toggle]").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("textarea")) return;
      const id = row.dataset.toggle;
      const detail = document.getElementById(`detail-${id}`);
      const arrow = document.getElementById(`arrow-${id}`);
      detail.classList.toggle("hidden");
      arrow.textContent = detail.classList.contains("hidden") ? "▾" : "▴";
    });
  });
  document.querySelectorAll(".mark-read").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await guarded(async () => { await api.post(`/notifications/${btn.dataset.id}/read`); });
      refreshFn();
    });
  });
  bindOfferActions(refreshFn);
}

function bindOfferActions(refreshFn) {
  document.querySelectorAll(".offer-respond").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const wrap = btn.closest(".offer-actions");
      const offerId = wrap.dataset.offer;
      const message = wrap.querySelector(".offer-msg").value.trim();
      await guarded(async () => {
        await api.post(`/students/offers/${offerId}/respond`, { response: btn.dataset.response, message: message || undefined });
        toast(`Response sent: ${btn.dataset.response}`, "success");
        refreshFn();
      });
    });
  });
}

async function renderStudentQueries() {
  renderShell("#/student/queries", "Ask TPO", "Send a question or request to the placement cell and track their reply here.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const queries = await api.get("/students/queries");
    setBody(`
      <div class="card" style="max-width:640px;margin-bottom:18px;">
        <h3>New Query</h3>
        <form id="queryForm">
          <div class="field"><label>Subject</label><input name="subject" placeholder="e.g. Resume verification, drive eligibility…" /></div>
          <div class="field"><label>Message</label><textarea name="message" required placeholder="Describe your question or request…"></textarea></div>
          <button class="btn btn-primary" type="submit">Send to TPO</button>
        </form>
      </div>
      <h3 style="font-family:var(--font-display);font-weight:600;margin-bottom:12px;">Your Queries</h3>
      ${queries.length ? queries.map((q) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <strong style="font-size:13.5px;">${escapeHtml(q.subject || "General query")}</strong>
              <div class="muted" style="font-size:12px;margin-top:2px;">${fmtDateTime(q.created_at)}</div>
            </div>
            <span class="seal-badge ${q.status === "Resolved" ? "selected" : "applied"}">${escapeHtml(q.status)}</span>
          </div>
          <p style="font-size:13.5px;margin:10px 0 0;white-space:pre-wrap;">${escapeHtml(q.message)}</p>
          ${q.reply ? `
            <div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--paper-line);">
              <div class="eyebrow" style="margin-bottom:4px;">TPO Reply · ${fmtDateTime(q.replied_at)}</div>
              <p style="font-size:13.5px;margin:0;white-space:pre-wrap;">${escapeHtml(q.reply)}</p>
            </div>
          ` : `<p class="muted" style="font-size:12.5px;margin-top:10px;">Awaiting a reply from the placement cell.</p>`}
        </div>
      `).join("") : `<div class="empty-state"><div class="glyph">💬</div>You haven't sent any queries yet.</div>`}
    `);

    document.getElementById("queryForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await guarded(async () => {
        await api.post("/students/queries", { subject: fd.get("subject"), message: fd.get("message") });
        toast("Query sent to TPO", "success");
        renderStudentQueries();
      });
    });
  });
}

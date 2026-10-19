// recruiter.js — Recruiter module views.

route("/recruiter/dashboard", renderRecruiterDashboard);
route("/recruiter/post-job", renderRecruiterPostJob);
route("/recruiter/jobs", renderRecruiterJobs);
route("/recruiter/jobs/:id/applicants", renderRecruiterApplicants);
route("/recruiter/notifications", renderRecruiterNotifications);

async function renderRecruiterDashboard() {
  renderShell("#/recruiter/dashboard", "Dashboard", "Your postings and applicant activity.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const [me, jobs] = await Promise.all([api.get("/recruiters/me"), api.get("/recruiters/jobs")]);
    const totalApplicants = jobs.reduce((s, j) => s + j.applicantCount, 0);
    const openJobs = jobs.filter((j) => j.is_active).length;

    setBody(`
      <div class="grid cols-3" style="margin-bottom:18px;">
        <div class="stat-card"><div class="value">${openJobs}</div><div class="label">Open Postings</div></div>
        <div class="stat-card"><div class="value">${jobs.length}</div><div class="label">Total Postings</div></div>
        <div class="stat-card"><div class="value">${totalApplicants}</div><div class="label">Total Applicants</div></div>
      </div>
      <div class="card">
        <h3>${escapeHtml(me.company?.name || "Your Company")}</h3>
        <p class="muted" style="font-size:13.5px;">${escapeHtml(me.full_name)} · ${escapeHtml(me.designation || "Recruiter")}</p>
        <a href="#/recruiter/post-job" class="btn btn-brass btn-sm" style="margin-top:8px;">+ Post a new job</a>
      </div>
      <div class="card">
        <h3>Recent Postings</h3>
        ${jobs.slice(0, 5).map((j) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--paper-line);">
            <div><strong style="font-size:13.5px;">${escapeHtml(j.title)}</strong><div class="muted" style="font-size:12px;">${j.applicantCount} applicant(s) · ${j.is_active ? "Open" : "Closed"}</div></div>
            <a href="#/recruiter/jobs/${j.id}/applicants" class="btn btn-ghost btn-sm">View applicants →</a>
          </div>
        `).join("") || `<p class="muted" style="font-size:13.5px">No jobs posted yet.</p>`}
      </div>
    `);
  });
}

async function renderRecruiterPostJob() {
  renderShell("#/recruiter/post-job", "Post a Job", "Define the role and eligibility criteria for candidates.", `
    <div class="card" style="max-width:640px;">
      <form id="jobForm">
        <div class="field"><label>Job title</label><input name="title" required placeholder="e.g. Backend Developer Intern" /></div>
        <div class="field"><label>Description</label><textarea name="description" placeholder="Role responsibilities, expectations..."></textarea></div>
        <div class="form-row">
          <div class="field"><label>Type</label>
            <select name="jobType"><option value="Full-Time">Full-Time</option><option value="Internship">Internship</option></select>
          </div>
          <div class="field"><label>Location</label><input name="location" placeholder="e.g. Bengaluru / Remote" /></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Salary / Stipend (₹ per annum)</label><input type="number" name="salaryPackage" min="0" /></div>
          <div class="field"><label>Minimum CGPA</label><input type="number" step="0.1" name="minCgpa" min="0" max="10" value="0" /></div>
          <div class="field"><label>Application Deadline</label><input type="date" name="deadline" /></div>
        </div>
        <div class="field"><label>Required skills (comma-separated)</label><input name="requiredSkills" placeholder="javascript, react, sql" /></div>
        <button class="btn btn-primary" type="submit">Publish job</button>
      </form>
    </div>
  `);

  document.getElementById("jobForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await guarded(async () => {
      await api.post("/recruiters/jobs", {
        title: fd.get("title"),
        description: fd.get("description"),
        jobType: fd.get("jobType"),
        location: fd.get("location"),
        salaryPackage: fd.get("salaryPackage") ? Number(fd.get("salaryPackage")) : null,
        minCgpa: fd.get("minCgpa") ? Number(fd.get("minCgpa")) : 0,
        requiredSkills: fd.get("requiredSkills").split(",").map((s) => s.trim()).filter(Boolean),
        deadline: fd.get("deadline") || null,
      });
      toast("Job posted successfully", "success");
      window.location.hash = "#/recruiter/jobs";
    });
  });
}

async function renderRecruiterJobs() {
  renderShell("#/recruiter/jobs", "My Postings", "Manage your job listings and review applicants.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const jobs = await api.get("/recruiters/jobs");
    setBody(`
      ${jobs.length ? `<div class="card"><table class="ledger">
        <thead><tr><th>Title</th><th>Type</th><th>Applicants</th><th>Deadline</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${jobs.map((j) => `
            <tr>
              <td><strong>${escapeHtml(j.title)}</strong></td>
              <td>${escapeHtml(j.job_type)}</td>
              <td>${j.applicantCount}</td>
              <td>${fmtDate(j.deadline)}</td>
              <td>${j.is_active ? `<span class="seal-badge selected">Open</span>` : `<span class="seal-badge rejected">Closed</span>`}</td>
              <td style="text-align:right;white-space:nowrap;">
                <a href="#/recruiter/jobs/${j.id}/applicants" class="btn btn-ghost btn-sm">Applicants</a>
                ${j.is_active ? `<button class="btn btn-danger btn-sm close-btn" data-id="${j.id}">Close</button>` : ""}
              </td>
            </tr>`).join("")}
        </tbody>
      </table></div>` : `<div class="empty-state"><div class="glyph">💼</div>You haven't posted any jobs yet. <a href="#/recruiter/post-job">Post your first job →</a></div>`}
    `);
    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await guarded(async () => { await api.put(`/recruiters/jobs/${btn.dataset.id}/close`); toast("Job closed", "success"); renderRecruiterJobs(); });
      });
    });
  });
}

async function renderRecruiterApplicants(params) {
  renderShell("#/recruiter/jobs", "Applicants", "Candidates ranked by AI match score (ATS score + skill overlap).", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const applicants = await api.get(`/recruiters/jobs/${params.id}/applicants`);
    setBody(`
      <a href="#/recruiter/jobs" class="btn btn-ghost btn-sm" style="margin-bottom:14px;">← Back to postings</a>
      ${applicants.length ? applicants.map((a) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
            <div>
              <h3 style="margin-bottom:2px;">${escapeHtml(a.full_name)}</h3>
              <div class="muted" style="font-size:13px;">${escapeHtml(a.enrollment_no || "")} · ${escapeHtml(a.department || "—")} · CGPA ${a.cgpa ?? "—"}</div>
              <div style="margin-top:10px;">
                <span class="match-pill ${a.matchPct >= 70 ? "" : a.matchPct >= 40 ? "mid" : "low"}">${a.matchPct}% skill match</span>
                ${a.ats_score_at_apply != null ? `<span class="tag" style="margin-left:8px;">ATS ${a.ats_score_at_apply}</span>` : ""}
              </div>
              <div style="margin-top:10px;">
                ${a.studentSkills.map((s) => `<span class="tag matched">${escapeHtml(s)}</span>`).join("")}
                ${a.missingSkills.map((s) => `<span class="tag missing">${escapeHtml(s)}</span>`).join("")}
              </div>
              <div style="margin-top:10px;">
                <button class="btn btn-ghost btn-sm view-resume" data-student="${a.student_id}">View resume</button>
              </div>
              ${a.offer_id ? `
                <div style="margin-top:12px;padding:10px 12px;border-radius:8px;background:${a.offer_response === "Accepted" ? "var(--forest-bg)" : a.offer_response === "Rejected" ? "var(--rust-bg)" : "var(--paper-alt)"};">
                  <div style="font-size:12.5px;font-weight:700;">Offer: ${fmtMoney(a.offer_package)} · <span class="seal-badge ${offerResponseClass(a.offer_response)}">${escapeHtml(a.offer_response)}</span></div>
                  ${a.offer_response_message ? `<div class="muted" style="font-size:12.5px;margin-top:5px;white-space:pre-wrap;">"${escapeHtml(a.offer_response_message)}"</div>` : ""}
                </div>
              ` : ""}
            </div>
            <div style="text-align:right;min-width:190px;">
              <span class="seal-badge ${statusClass(a.status)}">${escapeHtml(a.status)}</span>
              <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
                <select class="status-select" data-app="${a.id}">
                  ${["Applied","Shortlisted","Interview Scheduled","Selected","Rejected"].map((s) => `<option value="${s}" ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}
                </select>
                <button class="btn btn-brass btn-sm schedule-btn" data-app="${a.id}">Schedule Interview</button>
                <button class="btn btn-primary btn-sm offer-btn" data-app="${a.id}">Issue Offer</button>
              </div>
            </div>
          </div>
        </div>
      `).join("") : `<div class="empty-state"><div class="glyph">🗂️</div>No applicants yet for this job.</div>`}
    `);

    document.querySelectorAll(".status-select").forEach((sel) => {
      sel.addEventListener("change", async () => {
        await guarded(async () => {
          await api.put(`/recruiters/applications/${sel.dataset.app}/status`, { status: sel.value });
          toast("Status updated", "success");
        });
      });
    });
    document.querySelectorAll(".schedule-btn").forEach((btn) => {
      btn.addEventListener("click", () => openInterviewModal(btn.dataset.app, () => renderRecruiterApplicants(params)));
    });
    document.querySelectorAll(".offer-btn").forEach((btn) => {
      btn.addEventListener("click", () => openOfferModal(btn.dataset.app, () => renderRecruiterApplicants(params)));
    });
    document.querySelectorAll(".view-resume").forEach((btn) => {
      btn.addEventListener("click", () => toast("Resume download is available from the student's application record.", ""));
    });
  });
}

function openModal(html) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
  return backdrop;
}

function openInterviewModal(appId, onDone) {
  const backdrop = openModal(`
    <h3>Schedule Interview</h3>
    <form id="interviewForm">
      <div class="field"><label>Date & time</label><input type="datetime-local" name="scheduledAt" required /></div>
      <div class="field"><label>Mode</label><select name="mode"><option value="Online">Online</option><option value="Offline">Offline</option></select></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost btn-sm cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Schedule</button>
      </div>
    </form>
  `);
  backdrop.querySelector(".cancel-btn").addEventListener("click", () => backdrop.remove());
  backdrop.querySelector("#interviewForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await guarded(async () => {
      await api.post(`/recruiters/applications/${appId}/interview`, {
        scheduledAt: fd.get("scheduledAt"), mode: fd.get("mode"),
      });
      toast("Interview scheduled", "success");
      backdrop.remove();
      onDone();
    });
  });
}

function openOfferModal(appId, onDone) {
  const backdrop = openModal(`
    <h3>Issue Offer Letter</h3>
    <form id="offerForm">
      <div class="field"><label>Package (₹ per annum)</label><input type="number" name="packageAmount" min="0" required /></div>
      <div class="field"><label>Joining date</label><input type="date" name="joiningDate" /></div>
      <p class="hint muted">The candidate must have a scheduled interview before an offer can be issued.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost btn-sm cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Issue offer</button>
      </div>
    </form>
  `);
  backdrop.querySelector(".cancel-btn").addEventListener("click", () => backdrop.remove());
  backdrop.querySelector("#offerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await guarded(async () => {
      await api.post(`/recruiters/applications/${appId}/offer`, {
        packageAmount: Number(fd.get("packageAmount")), joiningDate: fd.get("joiningDate") || null,
      });
      toast("Offer issued", "success");
      backdrop.remove();
      onDone();
    });
  });
}

async function renderRecruiterNotifications() {
  renderShell("#/recruiter/notifications", "Notifications", "Applications and candidate responses.", `<div class="loading-line">Loading…</div>`);
  await guarded(async () => {
    const notifs = await api.get("/notifications");
    setBody(renderNotificationList(notifs));
    bindNotificationExpanders(renderRecruiterNotifications);
  });
}

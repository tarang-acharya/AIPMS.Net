// app.js — AIPMS single-page frontend (vanilla JS, hash router).

const app = document.getElementById("app");

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
}
function fmtDateTime(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return d; }
}
function fmtMoney(n) {
  if (n === null || n === undefined || n === "") return "—";
  return "₹" + Number(n).toLocaleString("en-IN");
}
function statusClass(status) {
  return {
    "Applied": "applied",
    "Shortlisted": "shortlisted",
    "Interview Scheduled": "interview",
    "Selected": "selected",
    "Rejected": "rejected",
  }[status] || "applied";
}
function offerResponseClass(r) {
  return { Pending: "applied", Accepted: "selected", Rejected: "rejected", Negotiating: "shortlisted" }[r] || "applied";
}

function toast(message, type = "") {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = message;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

async function guarded(fn) {
  try { await fn(); }
  catch (e) { toast(e.message || "Something went wrong", "error"); }
}

// ---------------------------------------------------------------
// Router
// ---------------------------------------------------------------
const routes = [];
function route(pattern, handler) { routes.push({ pattern, handler }); }
function matchRoute(hash) {
  for (const r of routes) {
    const keys = [];
    const regexStr = "^" + r.pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return "([^/]+)"; }) + "$";
    const match = hash.match(new RegExp(regexStr));
    if (match) {
      const params = {};
      keys.forEach((k, i) => (params[k] = match[i + 1]));
      return { handler: r.handler, params };
    }
  }
  return null;
}

function currentHash() {
  return (window.location.hash || "#/login").slice(1) || "/login";
}

async function render() {
  const hash = currentHash();
  const user = Auth.getUser();

  if (!Auth.isLoggedIn() || !user) {
    if (hash !== "/login" && hash !== "/register") {
      window.location.hash = "#/login";
      return;
    }
  } else if (hash === "/login" || hash === "/register" || hash === "/") {
    window.location.hash = defaultRouteFor(user.role);
    return;
  }

  const matched = matchRoute(hash);
  if (!matched) {
    app.innerHTML = `<div class="auth-panel"><div class="auth-card center"><h2>Page not found</h2><p class="muted">That page doesn't exist.</p></div></div>`;
    return;
  }
  await matched.handler(matched.params);
}

function defaultRouteFor(role) {
  return {
    student: "#/student/dashboard",
    recruiter: "#/recruiter/dashboard",
    tpo: "#/tpo/dashboard",
    admin: "#/admin/users",
  }[role] || "#/login";
}

window.addEventListener("hashchange", () => render());
window.addEventListener("DOMContentLoaded", () => render());

// ---------------------------------------------------------------
// Auth screens
// ---------------------------------------------------------------
route("/login", renderLogin);
route("/register", renderRegister);

function authHeroMarkup(activeLede) {
  return `
    <div class="auth-hero">
      <div class="ledger-lines"></div>
      <div class="hero-top">
        <div class="brand">${logoMarkup(34)}AIPMS<br></div>
      </div>
      <div>
        <div class="eyebrow" style="color:var(--brass-light)">Campus Placement, Automated</div>
        <h1>${activeLede}</h1>
        <p class="lede">One register for students, recruiters and the placement cell — with AI doing the resume screening, scoring and matching in the background.</p>
        <div class="hero-roles">
          <span>Students</span><span>Recruiters</span><span>TPO / Placement Cell</span><span>Administrators</span>
        </div>
      </div>
      <div></div>
    </div>`;
}

function renderLogin() {
  app.innerHTML = `
    <div class="auth-wrap">
      ${authHeroMarkup("Every placement,<br>on the record.")}
      <div class="auth-panel">
        <div class="auth-card">
          <div class="eyebrow">Welcome back</div>
          <h2>Sign in to your account</h2>
          <div id="authAlert"></div>
          <form id="loginForm">
            <div class="field">
              <label>I am signing in as</label>
              <select name="role" required>
                <option value="">Select a role…</option>
                <option value="student">Student</option>
                <option value="recruiter">Recruiter</option>
                <option value="tpo">TPO / Placement Cell</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div class="field"><label>Email</label><input type="email" name="email" required placeholder="you@example.com" /></div>
            <div class="field"><label>Password</label><input type="password" name="password" required placeholder="••••••••" /></div>
            <button class="btn btn-primary" style="width:100%" type="submit">Sign in</button>
          </form>
          <p class="muted" style="margin-top:18px;font-size:13.5px;">
            New here? <a href="#/register" style="color:var(--brass);font-weight:700;text-decoration:none;">Create a student or recruiter account</a>
          </p>
        </div>
      </div>
    </div>`;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const alertBox = document.getElementById("authAlert");
    alertBox.innerHTML = "";
    try {
      const data = await api.post("/auth/login", {
        role: fd.get("role"),
        email: fd.get("email"),
        password: fd.get("password"),
      });
      Auth.setSession(data.token, data.user);
      toast(`Welcome back, ${data.user.email}`, "success");
      window.location.hash = defaultRouteFor(data.user.role);
    } catch (err) {
      alertBox.innerHTML = `<div class="alert error">${escapeHtml(err.message)}</div>`;
    }
  });
}

function renderRegister() {
  app.innerHTML = `
    <div class="auth-wrap">
      ${authHeroMarkup("Your placement<br>journey starts here.")}
      <div class="auth-panel">
        <div class="auth-card">
          <div class="eyebrow">Create account</div>
          <h2>Register</h2>
          <div id="authAlert"></div>
          <div class="role-select">
            <label><input type="radio" name="roleSel" value="student" checked /><span>🎓 Student</span></label>
            <label><input type="radio" name="roleSel" value="recruiter" /><span>🏢 Recruiter</span></label>
          </div>
          <form id="registerForm">
            <div class="field"><label>Full name</label><input name="fullName" required /></div>
            <div class="field"><label>Email</label><input type="email" name="email" required /></div>
            <div class="field"><label>Password</label><input type="password" name="password" minlength="6" required /></div>

            <div id="studentFields">
              <div class="form-row">
                <div class="field"><label>Enrollment No.</label><input name="enrollmentNo" /></div>
                <div class="field"><label>CGPA</label><input name="cgpa" type="number" step="0.01" min="0" max="10" /></div>
              </div>
              <div class="field">
                <label>Department</label>
                <select name="departmentId" id="deptSelect"><option value="">Select…</option></select>
              </div>
            </div>
            <div id="recruiterFields" class="hidden">
              <div class="field"><label>Company name</label><input name="companyName" placeholder="e.g. TechNova Solutions" /></div>
              <div class="form-row">
                <div class="field"><label>Company location</label><input name="companyLocation" placeholder="e.g. Bengaluru, India" /></div>
                <div class="field"><label>Industry</label><input name="companyIndustry" placeholder="e.g. Software" /></div>
              </div>
              <div class="form-row">
                <div class="field"><label>Company website</label><input name="companyWebsite" placeholder="https://…" /></div>
                <div class="field"><label>Your designation</label><input name="designation" placeholder="e.g. HR Manager" /></div>
              </div>
              <div class="field"><label>Company description</label><textarea name="companyDescription" placeholder="What does the company do?"></textarea></div>
              <div class="field"><label>Your phone</label><input name="phone" placeholder="Optional" /></div>
              <p class="hint muted">Recruiter accounts and company details require TPO approval before you can sign in.</p>
            </div>

            <button class="btn btn-primary" style="width:100%" type="submit">Create account</button>
          </form>
          <p class="muted" style="margin-top:18px;font-size:13.5px;">
            Already registered? <a href="#/login" style="color:var(--brass);font-weight:700;text-decoration:none;">Sign in</a>
          </p>
        </div>
      </div>
    </div>`;

  guarded(async () => {
    const depts = await api.get("/public/departments");
    const sel = document.getElementById("deptSelect");
    depts.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id; opt.textContent = d.name;
      sel.appendChild(opt);
    });
  });

  document.querySelectorAll('input[name="roleSel"]').forEach((r) => {
    r.addEventListener("change", (e) => {
      const isStudent = e.target.value === "student";
      document.getElementById("studentFields").classList.toggle("hidden", !isStudent);
      document.getElementById("recruiterFields").classList.toggle("hidden", isStudent);
    });
  });

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const role = document.querySelector('input[name="roleSel"]:checked').value;
    const alertBox = document.getElementById("authAlert");
    alertBox.innerHTML = "";
    try {
      const payload = {
        role,
        fullName: fd.get("fullName"),
        email: fd.get("email"),
        password: fd.get("password"),
        enrollmentNo: fd.get("enrollmentNo") || undefined,
        cgpa: fd.get("cgpa") ? Number(fd.get("cgpa")) : undefined,
        departmentId: fd.get("departmentId") ? Number(fd.get("departmentId")) : undefined,
        companyName: fd.get("companyName") || undefined,
        companyLocation: fd.get("companyLocation") || undefined,
        companyIndustry: fd.get("companyIndustry") || undefined,
        companyWebsite: fd.get("companyWebsite") || undefined,
        companyDescription: fd.get("companyDescription") || undefined,
        designation: fd.get("designation") || undefined,
        phone: fd.get("phone") || undefined,
      };
      const data = await api.post("/auth/register", payload);
      alertBox.innerHTML = `<div class="alert success">${escapeHtml(data.message)} Redirecting to sign in…</div>`;
      setTimeout(() => (window.location.hash = "#/login"), 1400);
    } catch (err) {
      alertBox.innerHTML = `<div class="alert error">${escapeHtml(err.message)}</div>`;
    }
  });
}

function logout() {
  Auth.clear();
  window.location.hash = "#/login";
}

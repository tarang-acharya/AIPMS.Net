# AIPMS.Net

ASP.NET Core 10 conversion of AIPMS. The existing vanilla-JavaScript interface is preserved in `wwwroot/`, so the browser keeps using the same `/api/...` endpoints and role dashboards.

## Run

```powershell
dotnet run
```

Open the URL printed in the terminal. The app creates the SQLite database `App_Data/aipms.db` on the first run and seeds the same demonstration users, departments, companies, jobs, and skills as the Node version.

## Implementation notes

- ASP.NET Core 10 Minimal API replaces Express.
- `Models.cs` contains the former SQLite schema as C# domain models.
- `Services.cs` creates and maintains the SQLite schema (`users`, `students`, `recruiters`, `companies`, `jobs`, `applications`, `resumes`, `interviews`, `offer_letters`, `notifications`, and related tables), along with PBKDF2 password hashing, signed Bearer sessions, resume scoring, and local PDF/DOCX text extraction.
- `Program.cs` contains the compatible REST routes and serves the unchanged SPA.
- Files uploaded as resumes are stored under `App_Data/uploads`.

This conversion intentionally uses the Windows SQLite runtime already present on the computer, so it builds without downloading NuGet packages. The data is persisted in the SQLite database rather than a JSON file. For a production or college submission that specifically requires SQL Server, replace `AipmsStore` with EF Core plus `Microsoft.EntityFrameworkCore.SqlServer`; the domain models and API contracts are already separated from the store.

## Demo credentials

- Admin: `admin@aipms.local` / `Admin@123`
- TPO: `tpo@aipms.local` / `Tpo@1234`
- Recruiter: `hr@technova.com` / `Recruit@123`
- Student: `aditi.rao@student.aipms.local` / `Student@123`

Change the demo passwords and set `AIPMS_TOKEN_KEY` to a secret environment variable before deploying.

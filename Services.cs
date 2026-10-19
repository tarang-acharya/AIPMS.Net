using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Aipms.Net;

public sealed class AipmsStore
{
    private readonly object _gate = new();
    private readonly string _path;
    private readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web) { WriteIndented = true };
    private DatabaseState _state;

    public AipmsStore(IWebHostEnvironment environment)
    {
        var directory = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(directory);
        _path = Path.Combine(directory, "aipms.json");
        _state = File.Exists(_path)
            ? JsonSerializer.Deserialize<DatabaseState>(File.ReadAllText(_path), _json) ?? new DatabaseState()
            : Seed.Create();
        if (!File.Exists(_path)) Persist();
    }

    public T Read<T>(Func<DatabaseState, T> action) { lock (_gate) return action(_state); }
    public T Write<T>(Func<DatabaseState, T> action) { lock (_gate) { var result = action(_state); Persist(); return result; } }
    public void Write(Action<DatabaseState> action) { lock (_gate) { action(_state); Persist(); } }
    public static int Next(DatabaseState state) => state.NextId++;
    private void Persist() => File.WriteAllText(_path, JsonSerializer.Serialize(_state, _json));
}

public sealed class PasswordService
{
    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 210000, HashAlgorithmName.SHA256, 32);
        return $"pbkdf2$210000${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }
    public bool Verify(string password, string encoded)
    {
        var parts = encoded.Split('$');
        if (parts.Length != 4 || parts[0] != "pbkdf2" || !int.TryParse(parts[1], out var iterations)) return false;
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, Convert.FromBase64String(parts[2]), iterations, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(actual, Convert.FromBase64String(parts[3]));
    }
}

public sealed class TokenService(IConfiguration configuration)
{
    private readonly byte[] _key = Encoding.UTF8.GetBytes(configuration["AIPMS_TOKEN_KEY"] ?? "change-this-development-key-before-production-aipms");
    public string Create(User user)
    {
        var payload = JsonSerializer.Serialize(new TokenPayload(user.Id, user.Email, user.Role, DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds()));
        var data = Base64Url(Encoding.UTF8.GetBytes(payload));
        return $"{data}.{Base64Url(Sign(data))}";
    }
    public UserSession? Validate(string? authorization)
    {
        if (string.IsNullOrWhiteSpace(authorization) || !authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return null;
        var pieces = authorization[7..].Split('.');
        if (pieces.Length != 2 || !CryptographicOperations.FixedTimeEquals(Sign(pieces[0]), FromBase64Url(pieces[1]))) return null;
        try
        {
            var value = JsonSerializer.Deserialize<TokenPayload>(Encoding.UTF8.GetString(FromBase64Url(pieces[0])));
            return value is null || value.ExpiresAt < DateTimeOffset.UtcNow.ToUnixTimeSeconds() ? null : new UserSession(value.Id, value.Email, value.Role);
        }
        catch { return null; }
    }
    private byte[] Sign(string value) => HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(value));
    private static string Base64Url(byte[] value) => Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private static byte[] FromBase64Url(string value) => Convert.FromBase64String(value.Replace('-', '+').Replace('_', '/') + new string('=', (4 - value.Length % 4) % 4));
    private sealed record TokenPayload(int Id, string Email, string Role, long ExpiresAt);
}

public sealed class ResumeAnalyzer
{
    public static readonly string[] MasterSkills = ["javascript","typescript","python","java","c++","c#","c","php","ruby","go","rust","kotlin","swift","html","css","react","angular","vue","node.js","node","express","django","flask","spring","spring boot",".net","asp.net","bootstrap","tailwind","jquery","sql","mysql","postgresql","sql server","mongodb","sqlite","redis","firebase","oracle","machine learning","deep learning","data science","nlp","computer vision","tensorflow","pytorch","pandas","numpy","scikit-learn","power bi","tableau","excel","git","github","docker","kubernetes","aws","azure","gcp","linux","ci/cd","jenkins","rest api","graphql","microservices","agile","scrum","testing","unit testing","data structures","algorithms","oop","dbms","operating systems","computer networks","communication","teamwork","leadership","problem solving","time management"];
    private static readonly string[] ActionVerbs = ["developed","designed","implemented","built","created","led","managed","optimized","improved","achieved","reduced","increased","automated","launched","deployed","collaborated","analyzed","engineered","architected","delivered"];
    private static readonly Dictionary<string, string[]> Sections = new() { ["contact"] = ["email", "phone", "linkedin", "@"], ["education"] = ["education", "b.tech", "b.e", "bachelor", "university", "college", "cgpa", "gpa"], ["experience"] = ["experience", "internship", "worked", "employment"], ["projects"] = ["project", "projects"], ["skills"] = ["skill", "skills", "technologies", "tools"], ["certifications"] = ["certification", "certificate", "certified"] };
    public List<string> ExtractSkills(string text) => MasterSkills.Where(skill => Regex.IsMatch(text ?? "", $@"(^|[^a-z0-9]){Regex.Escape(skill)}([^a-z0-9]|$)", RegexOptions.IgnoreCase)).ToList();
    public (int Score, List<string> Notes, List<string> Skills) Score(string text)
    {
        var normalized = Regex.Replace((text ?? "").ToLowerInvariant(), @"\s+", " ");
        var words = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var notes = new List<string>(); var sectionsFound = 0;
        foreach (var (section, wordsForSection) in Sections) { if (wordsForSection.Any(normalized.Contains)) sectionsFound++; else notes.Add($"Add a clear \"{section}\" section — it wasn't detected."); }
        var skills = ExtractSkills(text ?? ""); var score = (int)Math.Round((double)sectionsFound / Sections.Count * 40) + Math.Min(25, (int)Math.Round(skills.Count * 2.5));
        if (skills.Count < 5) notes.Add("List more relevant technical skills — fewer than 5 were recognized.");
        var numeric = Regex.Matches(normalized, @"\d+%|\d+\+|\b\d{2,}\b").Count; score += Math.Min(15, numeric * 3);
        if (numeric == 0) notes.Add("Quantify your impact with numbers (e.g. \"improved performance by 30%\").");
        var verbs = ActionVerbs.Count(normalized.Contains); score += Math.Min(10, verbs * 2);
        if (verbs < 3) notes.Add("Use more strong action verbs (developed, led, optimized, automated...).");
        if (words.Length < 120) notes.Add("Resume looks too short — add more detail about projects/experience."); else if (words.Length > 1200) notes.Add("Resume looks very long — consider trimming to 1-2 pages."); else score += 10;
        return (Math.Clamp(score, 0, 100), notes, skills);
    }
    public (List<string> Required, List<string> Matched, List<string> Missing, int MatchPct) SkillGap(IEnumerable<string> studentSkills, IEnumerable<string> requiredSkills)
    {
        var required = requiredSkills.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim().ToLowerInvariant()).ToList(); var have = studentSkills.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var matched = required.Where(have.Contains).ToList(); var missing = required.Where(x => !have.Contains(x)).ToList();
        return (required, matched, missing, required.Count == 0 ? 100 : (int)Math.Round((double)matched.Count / required.Count * 100));
    }
}

public static class ResumeTextExtractor
{
    public static async Task<string> ExtractAsync(IFormFile file)
    {
        await using var buffer = new MemoryStream(); await file.CopyToAsync(buffer); var bytes = buffer.ToArray();
        if (Path.GetExtension(file.FileName).Equals(".docx", StringComparison.OrdinalIgnoreCase)) return ExtractDocx(bytes);
        return ExtractPdf(bytes);
    }
    private static string ExtractDocx(byte[] bytes)
    {
        using var archive = new ZipArchive(new MemoryStream(bytes)); var entry = archive.GetEntry("word/document.xml"); if (entry is null) return "";
        using var reader = new StreamReader(entry.Open()); return Regex.Replace(reader.ReadToEnd(), "<[^>]+>", " ").Replace("&amp;", "&");
    }
    private static string ExtractPdf(byte[] bytes)
    {
        var all = Encoding.Latin1.GetString(bytes); var pieces = new StringBuilder();
        foreach (Match m in Regex.Matches(all, @"\((?<text>(?:\\.|[^\\)])*)\)\s*(?:Tj|')", RegexOptions.Singleline)) pieces.Append(' ').Append(UnescapePdf(m.Groups["text"].Value));
        foreach (Match m in Regex.Matches(all, @"\[(?<text>.*?)\]\s*TJ", RegexOptions.Singleline)) foreach (Match t in Regex.Matches(m.Groups["text"].Value, @"\((?<text>(?:\\.|[^\\)])*)\)")) pieces.Append(' ').Append(UnescapePdf(t.Groups["text"].Value));
        return Regex.Replace(pieces.ToString(), @"\s+", " ").Trim();
    }
    private static string UnescapePdf(string value) => Regex.Replace(value, @"\\([nrtbf()\\])", m => m.Groups[1].Value switch { "n" => "\n", "r" => "\r", "t" => "\t", "b" => "\b", "f" => "\f", _ => m.Groups[1].Value });
}

public static class Seed
{
    public static DatabaseState Create()
    {
        var s = new DatabaseState(); int AddId() => AipmsStore.Next(s);
        foreach (var name in new[] { "Computer Science", "Information Technology", "Electronics", "Mechanical Engineering", "Civil Engineering" }) s.Departments.Add(new Department { Id = AddId(), Name = name });
        var courseMap = new Dictionary<string, string[]> { ["Computer Science"] = ["B.Tech CSE", "M.Tech CSE", "B.Tech CSE (AI & ML)"], ["Information Technology"] = ["B.Tech IT", "M.Tech IT"], ["Electronics"] = ["B.Tech ECE", "B.Tech EEE"], ["Mechanical Engineering"] = ["B.Tech Mechanical", "Diploma Mechanical"], ["Civil Engineering"] = ["B.Tech Civil", "Diploma Civil"] };
        foreach (var (department, courses) in courseMap) foreach (var course in courses) s.Courses.Add(new Course { Id = AddId(), DepartmentId = s.Departments.First(x => x.Name == department).Id, Name = course });
        foreach (var skill in ResumeAnalyzer.MasterSkills) s.Skills.Add(new Skill { Id = AddId(), Name = skill });
        var passwords = new PasswordService();
        User User(string email, string password, string role, bool approved = true) { var u = new User { Id = AddId(), Email = email, PasswordHash = passwords.Hash(password), Role = role, IsApproved = approved }; s.Users.Add(u); return u; }
        User("admin@aipms.local", "Admin@123", "admin"); User("tpo@aipms.local", "Tpo@1234", "tpo");
        Company Company(string name, string industry, string location, string description) { var c = new Company { Id = AddId(), Name = name, Industry = industry, Location = location, Description = description, IsVerified = true }; s.Companies.Add(c); return c; }
        var techno = Company("TechNova Solutions", "Software", "Bengaluru, India", "A product company building developer tools and SaaS platforms."); var data = Company("DataSphere Analytics", "Data / AI", "Pune, India", "Data analytics and applied ML consultancy for enterprise clients."); Company("BuildRight Infra", "Civil Engineering", "Ahmedabad, India", "Infrastructure and civil construction projects across Western India.");
        Recruiter Recruiter(string email, string password, string name, Company company) { var r = new Recruiter { Id = AddId(), UserId = User(email, password, "recruiter").Id, CompanyId = company.Id, FullName = name, Designation = "HR Manager" }; s.Recruiters.Add(r); return r; }
        var r1 = Recruiter("hr@technova.com", "Recruit@123", "Priya Sharma", techno); var r2 = Recruiter("hr@datasphere.com", "Recruit@123", "Arjun Mehta", data);
        Student Student(string email, string password, string name, string enrollment, string department, double cgpa, params string[] skills) { var st = new Student { Id = AddId(), UserId = User(email, password, "student").Id, FullName = name, EnrollmentNo = enrollment, DepartmentId = s.Departments.First(x => x.Name == department).Id, Cgpa = cgpa, PassingYear = 2026 }; s.Students.Add(st); foreach (var skill in skills) s.StudentSkills.Add(new StudentSkill { StudentId = st.Id, SkillId = s.Skills.First(x => x.Name == skill).Id }); return st; }
        Student("aditi.rao@student.aipms.local", "Student@123", "Aditi Rao", "22CS001", "Computer Science", 8.7, "javascript", "react", "node.js", "sql", "git"); Student("rahul.verma@student.aipms.local", "Student@123", "Rahul Verma", "22IT014", "Information Technology", 7.4, "python", "machine learning", "pandas", "sql");
        void Job(Recruiter r, string title, string description, string type, string location, double salary, double cgpa, params string[] skills) => s.Jobs.Add(new Job { Id = AddId(), RecruiterId = r.Id, Title = title, Description = description, JobType = type, Location = location, SalaryPackage = salary, MinCgpa = cgpa, RequiredSkills = skills.ToList(), Deadline = DateTime.UtcNow.AddDays(30) });
        Job(r1, "Frontend Developer Intern", "Build and ship UI features using React and modern JavaScript.", "Internship", "Bengaluru", 600000, 7, "javascript", "react", "css", "git"); Job(r1, "Full Stack Developer", "Work across a Node.js/React stack building placement-tech products.", "Full-Time", "Bengaluru", 1200000, 7.5, "javascript", "react", "node.js", "sql", "rest api"); Job(r2, "Data Analyst", "Analyze large datasets and build dashboards for business insights.", "Full-Time", "Pune", 900000, 7, "python", "sql", "pandas", "power bi"); Job(r2, "ML Engineer Intern", "Assist in building and evaluating machine learning models.", "Internship", "Remote", 500000, 7.5, "python", "machine learning", "pandas", "numpy");
        return s;
    }
}

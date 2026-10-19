namespace Aipms.Net;

public sealed class DatabaseState
{
    public int NextId { get; set; } = 1;
    public List<User> Users { get; set; } = [];
    public List<Department> Departments { get; set; } = [];
    public List<Course> Courses { get; set; } = [];
    public List<Company> Companies { get; set; } = [];
    public List<Recruiter> Recruiters { get; set; } = [];
    public List<Student> Students { get; set; } = [];
    public List<Skill> Skills { get; set; } = [];
    public List<StudentSkill> StudentSkills { get; set; } = [];
    public List<Resume> Resumes { get; set; } = [];
    public List<ResumeAnalysis> ResumeAnalyses { get; set; } = [];
    public List<Job> Jobs { get; set; } = [];
    public List<Application> Applications { get; set; } = [];
    public List<Interview> Interviews { get; set; } = [];
    public List<OfferLetter> OfferLetters { get; set; } = [];
    public List<PlacementDrive> PlacementDrives { get; set; } = [];
    public List<Notification> Notifications { get; set; } = [];
    public List<StudentQuery> StudentQueries { get; set; } = [];
    public List<PersonalMessage> PersonalMessages { get; set; } = [];
    public List<PersonalMessageRecipient> PersonalMessageRecipients { get; set; } = [];
    public List<AuditLog> AuditLogs { get; set; } = [];
}

public sealed class User { public int Id { get; set; } public string Email { get; set; } = ""; public string PasswordHash { get; set; } = ""; public string Role { get; set; } = ""; public bool IsActive { get; set; } = true; public bool IsApproved { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public sealed class Department { public int Id { get; set; } public string Name { get; set; } = ""; }
public sealed class Course { public int Id { get; set; } public int DepartmentId { get; set; } public string Name { get; set; } = ""; }
public sealed class Company { public int Id { get; set; } public string Name { get; set; } = ""; public string? Website { get; set; } public string? Industry { get; set; } public string? Location { get; set; } public string? Description { get; set; } public bool IsVerified { get; set; } }
public sealed class Student { public int Id { get; set; } public int UserId { get; set; } public string FullName { get; set; } = ""; public string? EnrollmentNo { get; set; } public int? DepartmentId { get; set; } public double? Cgpa { get; set; } public string? Phone { get; set; } public int? PassingYear { get; set; } public string? Bio { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public sealed class Recruiter { public int Id { get; set; } public int UserId { get; set; } public int? CompanyId { get; set; } public string FullName { get; set; } = ""; public string? Designation { get; set; } public string? Phone { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public sealed class Skill { public int Id { get; set; } public string Name { get; set; } = ""; }
public sealed class StudentSkill { public int StudentId { get; set; } public int SkillId { get; set; } }
public sealed class Resume { public int Id { get; set; } public int StudentId { get; set; } public string Filename { get; set; } = ""; public string Filepath { get; set; } = ""; public string? RawText { get; set; } public bool IsActive { get; set; } = true; public DateTime UploadedAt { get; set; } = DateTime.UtcNow; }
public sealed class ResumeAnalysis { public int Id { get; set; } public int ResumeId { get; set; } public int AtsScore { get; set; } public List<string> ExtractedSkills { get; set; } = []; public List<string> MissingSkills { get; set; } = []; public List<string> Suggestions { get; set; } = []; public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public sealed class Job { public int Id { get; set; } public int RecruiterId { get; set; } public string Title { get; set; } = ""; public string Description { get; set; } = ""; public string JobType { get; set; } = "Full-Time"; public string Location { get; set; } = ""; public double? SalaryPackage { get; set; } public double MinCgpa { get; set; } public List<string> RequiredSkills { get; set; } = []; public DateTime? Deadline { get; set; } public DateTime PostedAt { get; set; } = DateTime.UtcNow; public bool IsActive { get; set; } = true; }
public sealed class Application { public int Id { get; set; } public int JobId { get; set; } public int StudentId { get; set; } public string Status { get; set; } = "Applied"; public int? AtsScoreAtApply { get; set; } public DateTime AppliedAt { get; set; } = DateTime.UtcNow; }
public sealed class Interview { public int Id { get; set; } public int ApplicationId { get; set; } public DateTime? ScheduledAt { get; set; } public string Mode { get; set; } = "Online"; public string Status { get; set; } = "Scheduled"; public string? Feedback { get; set; } }
public sealed class OfferLetter { public int Id { get; set; } public int InterviewId { get; set; } public double? Package { get; set; } public DateTime? JoiningDate { get; set; } public string Response { get; set; } = "Pending"; public string? ResponseMessage { get; set; } public DateTime? RespondedAt { get; set; } public DateTime IssuedAt { get; set; } = DateTime.UtcNow; }
public sealed class PlacementDrive { public int Id { get; set; } public string Title { get; set; } = ""; public int? CompanyId { get; set; } public DateTime? DriveDate { get; set; } public string Description { get; set; } = ""; public string Status { get; set; } = "Upcoming"; public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public sealed class Notification { public int Id { get; set; } public int UserId { get; set; } public string Message { get; set; } = ""; public string Type { get; set; } = "general"; public string? Detail { get; set; } public int? ReferenceId { get; set; } public bool IsRead { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public sealed class StudentQuery { public int Id { get; set; } public int StudentId { get; set; } public string? Subject { get; set; } public string Message { get; set; } = ""; public string Status { get; set; } = "Open"; public string? Reply { get; set; } public DateTime? RepliedAt { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public sealed class PersonalMessage { public int Id { get; set; } public int SenderUserId { get; set; } public string? Subject { get; set; } public string Message { get; set; } = ""; public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public sealed class PersonalMessageRecipient { public int MessageId { get; set; } public int StudentId { get; set; } }
public sealed class AuditLog { public int Id { get; set; } public int? UserId { get; set; } public string Action { get; set; } = ""; public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }

public sealed record UserSession(int Id, string Email, string Role);
public sealed class RegisterRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; public string Role { get; set; } = ""; public string? FullName { get; set; } public int? DepartmentId { get; set; } public string? EnrollmentNo { get; set; } public double? Cgpa { get; set; } public string? CompanyName { get; set; } public string? CompanyLocation { get; set; } public string? CompanyIndustry { get; set; } public string? CompanyWebsite { get; set; } public string? CompanyDescription { get; set; } public string? Designation { get; set; } public string? Phone { get; set; } }
public sealed class LoginRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; public string? Role { get; set; } }
public sealed class StudentUpdateRequest { public string? FullName { get; set; } public string? Phone { get; set; } public double? Cgpa { get; set; } public int? PassingYear { get; set; } public int? DepartmentId { get; set; } public string? Bio { get; set; } public List<string>? SkillNames { get; set; } }
public sealed class JobRequest { public string? Title { get; set; } public string? Description { get; set; } public string? JobType { get; set; } public string? Location { get; set; } public double? SalaryPackage { get; set; } public double? MinCgpa { get; set; } public List<string>? RequiredSkills { get; set; } public DateTime? Deadline { get; set; } }
public sealed class StatusRequest { public string? Status { get; set; } }
public sealed class InterviewRequest { public DateTime? ScheduledAt { get; set; } public string? Mode { get; set; } }
public sealed class OfferRequest { public double? PackageAmount { get; set; } public DateTime? JoiningDate { get; set; } }
public sealed class OfferResponseRequest { public string? Response { get; set; } public string? Message { get; set; } }
public sealed class QueryRequest { public string? Subject { get; set; } public string? Message { get; set; } }
public sealed class ReplyRequest { public string? Reply { get; set; } }
public sealed class DepartmentRequest { public string? Name { get; set; } public List<string>? Courses { get; set; } }
public sealed class CourseRequest { public string? Name { get; set; } }
public sealed class DriveRequest { public string? Title { get; set; } public int? CompanyId { get; set; } public DateTime? DriveDate { get; set; } public string? Description { get; set; } }
public sealed class MessageRequest { public List<int>? StudentIds { get; set; } public string? Subject { get; set; } public string? Message { get; set; } }
public sealed class TextRequest { public string? Message { get; set; } }
public sealed class AdminUserRequest { public string? Email { get; set; } public string? Password { get; set; } public string? Role { get; set; } }

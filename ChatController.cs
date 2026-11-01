using Jellyfin.Data;
using Jellyfin.Database.Implementations.Enums;
using Jellyfin.Database.Implementations.Entities;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.Chat;

[ApiController]
[Route("ChatPlugin")]
public class ChatController : ControllerBase
{
    private readonly IUserManager _users;
    private readonly ILibraryManager _library;
    public ChatController(IUserManager users, ILibraryManager library) { _users = users; _library = library; }
    private bool CanSeeMessage(Message message, User user)
    {
        if (message.MovieId is not Guid movieId) return true;
        try { return _library.GetItemById(movieId)?.IsVisibleStandalone(user) == true; }
        catch { return false; } // Fail closed if a library or permission check is unavailable.
    }
    private User? Current => Guid.TryParse(User.FindFirst("Jellyfin-UserId")?.Value, out var id) && id != Guid.Empty ? _users.GetUserById(id) : null;
    private static bool Admin(User u) => u.HasPermission(PermissionKind.IsAdministrator);
    private static bool Enabled(ChatState s, User u) => Admin(u) || s.Everyone || s.AllowedUsers.Contains(u.Id);
    private static bool Visible(Room r, User u) => Admin(u) || r.Members.Count == 0 || r.Members.Contains(u.Id);

    [AllowAnonymous, HttpGet("chat.js")]
    public IActionResult Script()
    {
        Response.Headers.CacheControl = "no-store";
        var stream = GetType().Assembly.GetManifestResourceStream("Jellyfin.Plugin.Chat.Web.chat.js");
        return stream == null ? NotFound() : File(stream, "application/javascript");
    }
    [Authorize, HttpGet("me")]
    public IActionResult Me()
    {
        var u = Current; if (u == null) return Unauthorized();
        return Ok(Store.Read(s => new { enabled = Enabled(s, u), admin = Admin(u), userId = u.Id }));
    }
    [Authorize, HttpGet("rooms")]
    public IActionResult Rooms()
    {
        var u = Current; if (u == null) return Unauthorized();
        return Store.Read<IActionResult>(s => !Enabled(s, u) ? Forbid() : Ok(s.Rooms.Where(r => Visible(r, u)).ToArray()));
    }
    [Authorize, HttpGet("rooms/{id:guid}/messages")]
    public IActionResult Messages(Guid id)
    {
        var u = Current; if (u == null) return Unauthorized();
        return Store.Read<IActionResult>(s => !Enabled(s, u) || !s.Rooms.Any(r => r.Id == id && Visible(r, u)) ? Forbid() : Ok(s.Messages.Where(m => m.RoomId == id && CanSeeMessage(m, u)).TakeLast(200).ToArray()));
    }
    [Authorize, HttpGet("unread")]
    public IActionResult Unread()
    {
        var u = Current; if (u == null) return Unauthorized();
        return Store.Read<IActionResult>(s => {
            if (!Enabled(s, u)) return Forbid();
            var counts = new Dictionary<string, int>();
            var latest = new Dictionary<string, string>();
            s.ReadMarks.TryGetValue(u.Id, out var marks);
            foreach (var room in s.Rooms.Where(r => Visible(r, u)))
            {
                var all = s.Messages.Where(m => m.RoomId == room.Id).ToList();
                var index = marks != null && marks.TryGetValue(room.Id, out var last) ? all.FindIndex(m => m.Id == last) : -1;
                var pending = all.Skip(index + 1).Where(m => m.UserId != u.Id && CanSeeMessage(m, u)).ToList();
                if (pending.Count > 0)
                {
                    var key = room.Id.ToString("N");
                    counts[key] = pending.Count;
                    latest[key] = pending[^1].Id.ToString("N");
                }
            }
            return Ok(new { total = counts.Values.Sum(), rooms = counts, latest });
        });
    }
    public class ReadRequest { public Guid MessageId { get; set; } }
    [Authorize, HttpPost("rooms/{id:guid}/read")]
    public IActionResult MarkRead(Guid id, [FromBody] ReadRequest request)
    {
        var u = Current; if (u == null) return Unauthorized();
        return Store.Change<IActionResult>(s => {
            if (!Enabled(s, u) || !s.Rooms.Any(r => r.Id == id && Visible(r, u))) return Forbid();
            var all = s.Messages.Where(m => m.RoomId == id).ToList();
            var index = all.FindIndex(m => m.Id == request.MessageId && CanSeeMessage(m, u));
            if (index < 0) return BadRequest();
            if (!s.ReadMarks.TryGetValue(u.Id, out var marks)) s.ReadMarks[u.Id] = marks = new();
            if (!marks.TryGetValue(id, out var previous) || all.FindIndex(m => m.Id == previous) < index) marks[id] = request.MessageId;
            return Ok();
        });
    }
    public class SendRequest { public string? Text { get; set; } }
    [Authorize, HttpPost("rooms/{id:guid}/messages")]
    public IActionResult Send(Guid id, [FromBody] SendRequest request)
    {
        var u = Current; if (u == null) return Unauthorized();
        var text = request.Text?.Trim(); if (string.IsNullOrEmpty(text) || text.Length > 2000) return BadRequest();
        return Store.Change<IActionResult>(s => {
            var room = s.Rooms.FirstOrDefault(r => r.Id == id);
            if (!Enabled(s, u) || room == null || !Visible(room, u) || (room.AdminOnly && !Admin(u))) return Forbid();
            s.Messages.Add(new Message { RoomId = id, UserId = u.Id, UserName = u.Username, Text = text });
            return Ok();
        });
    }
    [Authorize, HttpGet("settings")]
    public IActionResult Settings()
    {
        var u = Current; if (u == null || !Admin(u)) return Forbid();
        return Ok(Store.Read(s => new { everyone = s.Everyone, allowedUsers = s.AllowedUsers, rooms = s.Rooms, users = _users.GetUsers().Select(x => new { id = x.Id, name = x.Username }).ToArray() }));
    }
    public class SettingsRequest { public bool Everyone { get; set; } public List<Guid>? AllowedUsers { get; set; } }
    [Authorize, HttpPut("settings")]
    public IActionResult SaveSettings([FromBody] SettingsRequest request)
    {
        var u = Current; if (u == null || !Admin(u)) return Forbid();
        return Store.Change<IActionResult>(s => { s.Everyone = request.Everyone; s.AllowedUsers = (request.AllowedUsers ?? new()).Distinct().ToList(); return Ok(); });
    }
    // Only people who can currently use chat are offered as conversation partners.
    [Authorize, HttpGet("users")]
    public IActionResult Users()
    {
        var u = Current; if (u == null) return Unauthorized();
        return Store.Read<IActionResult>(s => !Enabled(s, u) ? Forbid() : Ok(_users.GetUsers()
            .Where(x => x.Id != u.Id && Enabled(s, x) && !x.HasPermission(PermissionKind.IsDisabled))
            .Select(x => new { id = x.Id, name = x.Username }).ToArray()));
    }
    public class RoomRequest { public string? Name { get; set; } public bool AdminOnly { get; set; } public List<Guid>? Members { get; set; } }
    [Authorize, HttpPost("rooms")]
    public IActionResult CreateRoom([FromBody] RoomRequest request)
    {
        var u = Current; if (u == null) return Unauthorized();
        var name = request.Name?.Trim(); if (string.IsNullOrEmpty(name) || name.Length > 80) return BadRequest();
        var members = (request.Members ?? new()).Distinct().ToList();
        if (members.Count > 100 || (!Admin(u) && (request.AdminOnly || members.Count == 0))) return BadRequest();
        return Store.Change<IActionResult>(s => {
            if (!Enabled(s, u)) return Forbid();
            if (!Admin(u) && members.Any(id => {
                if (id == Guid.Empty || id == u.Id) return true;
                var member = _users.GetUserById(id);
                return member == null || !Enabled(s, member) || member.HasPermission(PermissionKind.IsDisabled);
            })) return BadRequest();
            if (!Admin(u)) members.Add(u.Id);
            var r = new Room { Name = name, AdminOnly = request.AdminOnly, Members = members };
            s.Rooms.Add(r); return Ok(r);
        });
    }
    public class DirectRequest { public Guid UserId { get; set; } }
    [Authorize, HttpPost("direct")]
    public IActionResult CreateDirect([FromBody] DirectRequest request)
    {
        var u = Current; if (u == null) return Unauthorized();
        if (request.UserId == Guid.Empty || request.UserId == u.Id) return BadRequest();
        var other = _users.GetUserById(request.UserId);
        if (other == null || other.HasPermission(PermissionKind.IsDisabled)) return BadRequest();
        return Store.Change<IActionResult>(s => {
            if (!Enabled(s, u)) return Forbid();
            if (!Enabled(s, other)) return BadRequest();
            var existing = s.Rooms.FirstOrDefault(r => r.Direct && r.Members.Count == 2 && r.Members.Contains(u.Id) && r.Members.Contains(other.Id));
            if (existing != null) return Ok(existing);
            var room = new Room { Name = u.Username + " & " + other.Username, Direct = true, Members = new List<Guid> { u.Id, other.Id } };
            s.Rooms.Add(room); return Ok(room);
        });
    }
    [Authorize, HttpDelete("rooms/{id:guid}")]
    public IActionResult DeleteRoom(Guid id)
    {
        var u = Current; if (u == null || !Admin(u)) return Forbid();
        return Store.Change<IActionResult>(s => { if (s.Rooms.RemoveAll(r => r.Id == id) == 0) return NotFound(); s.Messages.RemoveAll(m => m.RoomId == id); foreach (var marks in s.ReadMarks.Values) marks.Remove(id); return Ok(); });
    }
}

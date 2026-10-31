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
    public ChatController(IUserManager users) => _users = users;
    private User? Current => Guid.TryParse(User.FindFirst("Jellyfin-UserId")?.Value, out var id) && id != Guid.Empty ? _users.GetUserById(id) : null;
    private static bool Admin(User u) => u.HasPermission(PermissionKind.IsAdministrator);
    private static bool Enabled(ChatState s, User u) => Admin(u) || s.Everyone || s.AllowedUsers.Contains(u.Id);
    private static bool Visible(Room r, User u) => Admin(u) || r.Members.Count == 0 || r.Members.Contains(u.Id);

    [AllowAnonymous, HttpGet("chat.js")]
    public IActionResult Script()
    {
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
        return Store.Read<IActionResult>(s => !Enabled(s, u) || !s.Rooms.Any(r => r.Id == id && Visible(r, u)) ? Forbid() : Ok(s.Messages.Where(m => m.RoomId == id).TakeLast(200).ToArray()));
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
    public class RoomRequest { public string? Name { get; set; } public bool AdminOnly { get; set; } public List<Guid>? Members { get; set; } }
    [Authorize, HttpPost("rooms")]
    public IActionResult CreateRoom([FromBody] RoomRequest request)
    {
        var u = Current; if (u == null || !Admin(u)) return Forbid();
        var name = request.Name?.Trim(); if (string.IsNullOrEmpty(name) || name.Length > 80) return BadRequest();
        return Store.Change<IActionResult>(s => { var r = new Room { Name = name, AdminOnly = request.AdminOnly, Members = (request.Members ?? new()).Distinct().ToList() }; s.Rooms.Add(r); return Ok(r); });
    }
    [Authorize, HttpDelete("rooms/{id:guid}")]
    public IActionResult DeleteRoom(Guid id)
    {
        var u = Current; if (u == null || !Admin(u)) return Forbid();
        return Store.Change<IActionResult>(s => { if (s.Rooms.RemoveAll(r => r.Id == id) == 0) return NotFound(); s.Messages.RemoveAll(m => m.RoomId == id); return Ok(); });
    }
}

using System.Text.Json;
using System.Text.Json.Serialization;

namespace Jellyfin.Plugin.Chat;

public class ChatState
{
    public bool Everyone { get; set; } = true;
    public List<Guid> AllowedUsers { get; set; } = new();
    public List<Room> Rooms { get; set; } = new() { new Room { Name = "Algemeen" } };
    public List<Message> Messages { get; set; } = new();
}
public class Room
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";
    [JsonPropertyName("adminOnly")]
    public bool AdminOnly { get; set; }
    // An empty list means all users with chat access.
    [JsonPropertyName("members")]
    public List<Guid> Members { get; set; } = new();
}
public class Message
{
    [JsonPropertyName("roomId")]
    public Guid RoomId { get; set; }
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }
    [JsonPropertyName("userName")]
    public string UserName { get; set; } = "";
    [JsonPropertyName("text")]
    public string Text { get; set; } = "";
    [JsonPropertyName("time")]
    public DateTimeOffset Time { get; set; } = DateTimeOffset.UtcNow;
}
internal static class Store
{
    private static readonly object Gate = new();
    // Also read data written before camel-case API names were introduced.
    private static readonly JsonSerializerOptions Options = new() { PropertyNameCaseInsensitive = true };
    private static string _path = "";
    private static ChatState _state = new();
    public static void Initialize(string path)
    {
        lock (Gate) { _path = path; if (File.Exists(path)) _state = JsonSerializer.Deserialize<ChatState>(File.ReadAllText(path), Options) ?? throw new InvalidDataException("Invalid chat data"); }
    }
    public static T Read<T>(Func<ChatState, T> action) { lock (Gate) return action(_state); }
    public static T Change<T>(Func<ChatState, T> action)
    {
        lock (Gate)
        {
            // Work on a copy so a failed write does not change the live state.
            var copy = JsonSerializer.Deserialize<ChatState>(JsonSerializer.Serialize(_state), Options)!;
            var result = action(copy);
            var tmp = _path + ".tmp";
            File.WriteAllText(tmp, JsonSerializer.Serialize(copy));
            File.Move(tmp, _path, true);
            _state = copy;
            return result;
        }
    }
}

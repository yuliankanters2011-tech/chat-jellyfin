using MediaBrowser.Controller.Entities.Movies;
using MediaBrowser.Controller.Library;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.Chat;

/// <summary>Posts new library films in a dedicated announcement room.</summary>
public sealed class MovieAnnouncements : IHostedService
{
    private static readonly Guid RoomId = Guid.Parse("e10b0709-70da-40e1-aa5a-25c160416e7a");
    private readonly ILibraryManager _library;
    private readonly ILogger<MovieAnnouncements> _logger;
    public MovieAnnouncements(ILibraryManager library, ILogger<MovieAnnouncements> logger) { _library = library; _logger = logger; }
    public Task StartAsync(CancellationToken cancellationToken) { _library.ItemAdded += OnItemAdded; return Task.CompletedTask; }
    public Task StopAsync(CancellationToken cancellationToken) { _library.ItemAdded -= OnItemAdded; return Task.CompletedTask; }
    private void OnItemAdded(object? sender, ItemChangeEventArgs args)
    {
        if (args.Item is not Movie movie || movie.Id == Guid.Empty || movie.IsVirtualItem || movie.ExtraType != null) return;
        try
        {
            Store.Change(s => {
                if (!s.AnnouncedMovies.Add(movie.Id)) return false;
                if (!s.Rooms.Any(r => r.Id == RoomId)) s.Rooms.Add(new Room { Id = RoomId, Name = "Nieuwe films", AdminOnly = true });
                var title = string.IsNullOrWhiteSpace(movie.Name) ? "Een nieuwe film" : movie.Name.Trim();
                s.Messages.Add(new Message { RoomId = RoomId, UserName = "Jellyfin", UserId = Guid.Empty, MovieId = movie.Id, Text = "Nieuw op Jellyfin: " + title });
                return true;
            });
        }
        catch (Exception ex) { _logger.LogError(ex, "Kon filmaankondiging niet opslaan voor {MovieId}", movie.Id); }
    }
}

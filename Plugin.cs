using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;

namespace Jellyfin.Plugin.Chat;

public class Plugin : BasePlugin
{
    public Plugin(IApplicationPaths paths)
    {
        var assembly = GetType().Assembly;
        SetAttributes(assembly.Location, Path.GetDirectoryName(assembly.Location)!, assembly.GetName().Version!);
        Store.Initialize(Path.Combine(paths.DataPath, "jellyfin-chat.json"));
    }
    public override string Name => "Chat";
    public override Guid Id => Guid.Parse("8537738c-f9b3-4b80-a483-33d9229bfc89");
}

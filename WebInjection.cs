using System.Text;
using MediaBrowser.Common.Net;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Controller.Plugins;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;

namespace Jellyfin.Plugin.Chat;

// A startup filter runs before Jellyfin's static-file middleware, without modifying files on disk.
public sealed class ChatServiceRegistrator : IPluginServiceRegistrator
{
    public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
        => serviceCollection.AddSingleton<IStartupFilter, ChatStartupFilter>();
}

public sealed class ChatStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
    {
        app.Use(async (context, nextMiddleware) =>
        {
            var config = context.RequestServices.GetRequiredService<IServerConfigurationManager>();
            await ChatWebInjection.InvokeAsync(context, nextMiddleware, config.GetNetworkConfiguration().BaseUrl).ConfigureAwait(false);
        });
        next(app);
    };
}

public static class ChatWebInjection
{
    private static readonly string Script = $"<script defer src=\"../ChatPlugin/chat.js?v={typeof(ChatWebInjection).Assembly.GetName().Version}\"></script>";
    private static readonly string[] RequestHeaders = { "Accept-Encoding", "If-None-Match", "If-Modified-Since", "Range", "If-Range" };

    public static async Task InvokeAsync(HttpContext context, RequestDelegate next, string? baseUrl)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var prefix = (baseUrl ?? string.Empty).TrimEnd('/');
        if (!HttpMethods.IsGet(context.Request.Method) ||
            !(path.Equals(prefix + "/web/", StringComparison.OrdinalIgnoreCase) ||
              path.Equals(prefix + "/web/index.html", StringComparison.OrdinalIgnoreCase)))
        {
            await next(context).ConfigureAwait(false);
            return;
        }

        // Prevent compressed, partial or cached responses from bypassing the injection.
        var savedHeaders = new Dictionary<string, StringValues>();
        foreach (var name in RequestHeaders)
        {
            if (context.Request.Headers.TryGetValue(name, out var value)) savedHeaders[name] = value;
            context.Request.Headers.Remove(name);
        }
        var originalBody = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;
        try
        {
            await next(context).ConfigureAwait(false);
        }
        finally
        {
            context.Response.Body = originalBody;
            foreach (var (name, value) in savedHeaders) context.Request.Headers[name] = value;
        }

        var bytes = buffer.ToArray();
        var response = context.Response;
        if (response.StatusCode == StatusCodes.Status200OK &&
            response.ContentType?.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) == true &&
            !response.Headers.ContainsKey("Content-Encoding") && bytes.Length <= 4 * 1024 * 1024)
        {
            var html = Encoding.UTF8.GetString(bytes);
            var end = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
            if (end >= 0 && !html.Contains("ChatPlugin/chat.js", StringComparison.OrdinalIgnoreCase))
            {
                bytes = Encoding.UTF8.GetBytes(html.Insert(end, Script));
                response.ContentLength = bytes.Length;
                response.Headers.Remove("ETag");
                response.Headers.Remove("Content-MD5");
                response.Headers.CacheControl = "no-cache, no-store";
            }
        }
        await originalBody.WriteAsync(bytes, context.RequestAborted).ConfigureAwait(false);
    }
}

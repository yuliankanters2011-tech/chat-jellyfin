using System.Text;
using Jellyfin.Plugin.Chat;
using Microsoft.AspNetCore.Http;

static void Check(bool condition, string message)
{
    if (!condition) throw new Exception(message);
}

static async Task<(DefaultHttpContext Context, string Body)> Run(
    string path, string baseUrl, string html, int status = 200, string type = "text/html", string method = "GET", bool conditional = false, string pathBase = "")
{
    var context = new DefaultHttpContext();
    context.Request.Path = path;
    context.Request.PathBase = pathBase;
    context.Request.Method = method;
    context.Response.Body = new MemoryStream();
    if (conditional)
    {
        context.Request.Headers.IfNoneMatch = "\"old\"";
        context.Request.Headers.AcceptEncoding = "gzip";
        context.Request.Headers.Range = "bytes=0-2";
    }
    await ChatWebInjection.InvokeAsync(context, async ctx =>
    {
        if (conditional && method == "GET")
            Check(!ctx.Request.Headers.ContainsKey("If-None-Match") && !ctx.Request.Headers.ContainsKey("Accept-Encoding") && !ctx.Request.Headers.ContainsKey("Range"), "Conditional, compression and range headers must not reach static files");
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = type;
        ctx.Response.Headers.ETag = "\"old\"";
        ctx.Response.ContentLength = Encoding.UTF8.GetByteCount(html);
        await ctx.Response.WriteAsync(html);
    }, baseUrl);
    context.Response.Body.Position = 0;
    using var reader = new StreamReader(context.Response.Body);
    return (context, await reader.ReadToEndAsync());
}

var (root, injected) = await Run("/web/", "", "<html><body>Hello</body></html>", conditional: true);
Check(injected.Contains("<script defer src=\"../ChatPlugin/chat.js?v=") && injected.Contains("\"></script></body>"), "Root page must include the versioned script");
Check(root.Response.ContentLength == Encoding.UTF8.GetByteCount(injected), "Content length must match injected bytes");
Check(!root.Response.Headers.ContainsKey("ETag"), "Old ETag must be removed");
Check(root.Response.Headers.CacheControl.ToString().Contains("no-store"), "Modified page must not be cached");
Check(root.Request.Headers.IfNoneMatch == "\"old\"", "Request headers must be restored");
var (_, based) = await Run("/jellyfin/web/index.html", "/jellyfin", "<body>x</BODY>");
Check(based.Contains("ChatPlugin/chat.js"), "Base URL must be supported");
var (_, basedPath) = await Run("/web/index.html", "/jellyfin", "<body>x</body>", pathBase: "/jellyfin");
Check(basedPath.Contains("../ChatPlugin/chat.js"), "PathBase-rewritten URL must be supported");
var (_, shortWeb) = await Run("/web", "/jellyfin", "<body>x</body>", pathBase: "/jellyfin");
Check(shortWeb.Contains("web/../ChatPlugin/chat.js"), "Web page without trailing slash must use the correct script URL");
Check(new Uri(new Uri("https://example.test/jellyfin/web"), "web/../ChatPlugin/chat.js").AbsolutePath == "/jellyfin/ChatPlugin/chat.js", "Slashless web script must resolve inside the configured base URL");
var (_, wrongBase) = await Run("/web/index.html", "/jellyfin", "<body>x</body>", pathBase: "/other");
Check(!wrongBase.Contains("ChatPlugin/chat.js"), "Unrelated PathBase must not be modified");
var original = "<body><script defer src=\"../ChatPlugin/chat.js\"></script></body>";
var (_, existing) = await Run("/web/index.html", "", original);
Check(existing == original, "Existing script must not be duplicated");
var (_, other) = await Run("/web/other.html", "", "<body>x</body>");
Check(other == "<body>x</body>", "Other files must pass through");
var (_, missing) = await Run("/web/index.html", "", "<body>error</body>", status: 404);
Check(missing == "<body>error</body>", "Error responses must pass through");
var (_, nonHtml) = await Run("/web/index.html", "", "<body>x</body>", type: "application/json");
Check(nonHtml == "<body>x</body>", "Non-HTML responses must pass through");
var (_, head) = await Run("/web/index.html", "", "<body>x</body>", method: "HEAD");
Check(head == "<body>x</body>", "HEAD must pass through");
Console.WriteLine("Chat web injection tests passed.");
// Jellyfin serializes responses in PascalCase by default; these contracts must stay camelCase.
var roomJson = System.Text.Json.JsonSerializer.Serialize(new Room { Name = "Algemeen", AdminOnly = true });
using var roomDoc = System.Text.Json.JsonDocument.Parse(roomJson);
Check(roomDoc.RootElement.GetProperty("name").GetString() == "Algemeen", "Room API names must match the client");
Check(roomDoc.RootElement.GetProperty("adminOnly").GetBoolean(), "Room permissions must use the expected API name");
var messageJson = System.Text.Json.JsonSerializer.Serialize(new Message { Text = "test", UserName = "admin" });
using var messageDoc = System.Text.Json.JsonDocument.Parse(messageJson);
Check(messageDoc.RootElement.GetProperty("userName").GetString() == "admin", "Message API names must match the client");

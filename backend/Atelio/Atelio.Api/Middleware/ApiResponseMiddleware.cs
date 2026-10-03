using Atelio.Api.ApiResponse;
using System.Text.Json;

namespace Atelio.Api.Middleware;

/// <summary>Enveloppe les réponses des contrôleurs : { code, response, responseMessage }.</summary>
public class ApiResponseMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        // Accents lisibles dans le JSON ("é" plutôt que son code échappé).
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    private readonly RequestDelegate _next;

    public ApiResponseMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        var originalBodyStream = context.Response.Body;

        try
        {
            using var memoryStream = new MemoryStream();
            context.Response.Body = memoryStream;

            await _next(context);

            // 204 No Content ne doit jamais avoir de body.
            if (context.Response.StatusCode == StatusCodes.Status204NoContent)
            {
                return;
            }

            memoryStream.Position = 0;
            var body = await new StreamReader(memoryStream).ReadToEndAsync();

            object? data = string.IsNullOrWhiteSpace(body) ? null : JsonSerializer.Deserialize<JsonElement>(body);
            var isSuccess = context.Response.StatusCode is >= 200 and < 300;

            var wrapped = new ApiResponse<object?>(context.Response.StatusCode, data, isSuccess ? "Success" : "Error");

            context.Response.Body = originalBodyStream;
            context.Response.ContentType = "application/json";
            context.Response.ContentLength = null;
            await context.Response.WriteAsync(JsonSerializer.Serialize(wrapped, JsonOptions));
        }
        finally
        {
            context.Response.Body = originalBodyStream;
        }
    }
}

using Atelio.Api.Middleware;
using Atelio.Application;
using Atelio.Application.Common;
using Atelio.Infrastructure;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using MediatR;
using Microsoft.OpenApi;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// Dependency Injection - Autofac
// ============================================================

builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());

builder.Host.ConfigureContainer<ContainerBuilder>(container =>
{
    container.RegisterModule(new ApplicationModule());
    container.RegisterModule(new InfrastructureModule());
});

// ============================================================
// MVC / Controllers
// ============================================================

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        // Enums en texte : "confirmed", "no_show"...
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.SnakeCaseLower));
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    // En-tête X-Tenant proposé dans Swagger pour choisir la marque blanche.
    options.AddSecurityDefinition(TenantMiddleware.HeaderName, new OpenApiSecurityScheme
    {
        Name = TenantMiddleware.HeaderName,
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Description = "Marque blanche (ex. garage-dupont)",
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference(TenantMiddleware.HeaderName, document)] = [],
    });
});

builder.Services.Configure<RouteOptions>(options => options.LowercaseUrls = true);

// ============================================================
// Infrastructure (EF Core, Dapper, marques blanches)
// ============================================================

builder.Services.ConfigureInfrastructureServices(builder.Configuration);

// ============================================================
// MediatR
// ============================================================

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(ApplicationModule).Assembly));

builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(RequestPipelineBehavior<,>));

// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy
            .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [])
            .AllowAnyHeader()
            .AllowAnyMethod());
});

// ============================================================
// HTTP Pipeline
// ============================================================

var app = builder.Build();

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlerMiddleware>();

// Base de la marque blanche (en-tête X-Tenant), avant tout accès aux données.
app.UseMiddleware<TenantMiddleware>();

app.UseMiddleware<ApiResponseMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();

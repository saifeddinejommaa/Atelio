using Atelio.Api.Middleware;
using Atelio.Application;
using Atelio.Application.Common;
using Atelio.Infrastructure;
using Atelio.Infrastructure.Auth;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using MediatR;
using Microsoft.AspNetCore.Authorization;
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
        // Enums en texte : "card", "mechanic"... (les statuts sont renvoyés par id et libellé de leur table).
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
        Description = "Marque blanche (ex. gmg, sej)",
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
// Authentification
// - clients b2c : jeton émis par /api/auth/customer (code par e-mail), routes /me ;
// - personnel des garages (back-office) : jeton Microsoft Entra du tenant Gustaya, toutes les autres routes
//   (sauf celles marquées [AllowAnonymous], utilisées par le site b2c sans connexion).
// ============================================================

var customerAuth = builder.Configuration.GetSection(CustomerAuthOptions.SectionName).Get<CustomerAuthOptions>()
    ?? throw new InvalidOperationException("Section CustomerAuth manquante dans la configuration.");
var entraId = builder.Configuration.GetSection(EntraIdOptions.SectionName).Get<EntraIdOptions>()
    ?? throw new InvalidOperationException("Section EntraId manquante dans la configuration.");

builder.Services
    .AddAuthentication()
    .AddJwtBearer(CustomerAuthPolicy.Scheme, options =>
    {
        // Claims gardés tels quels (cid, tenant).
        options.MapInboundClaims = false;
        options.TokenValidationParameters = CustomerTokenService.ValidationParameters(customerAuth.SigningKey, CustomerClaims.SessionAudience);
    })
    .AddJwtBearer(StaffAuth.Scheme, options =>
    {
        // Jetons v2 du tenant Gustaya, destinés à l'API (client id ou URI api://).
        options.Authority = $"{entraId.Instance.TrimEnd('/')}/{entraId.TenantId}/v2.0";
        options.MapInboundClaims = false;
        options.TokenValidationParameters.ValidAudiences = [entraId.ApiClientId, $"api://{entraId.ApiClientId}"];
        options.TokenValidationParameters.NameClaimType = "name";
        // Rôles d'application (Admin, Staff) dans le claim « roles ».
        options.TokenValidationParameters.RoleClaimType = "roles";
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(CustomerAuthPolicy.Name, CustomerAuthPolicy.Configure);
    StaffAuth.AddPolicies(options);
});
builder.Services.AddScoped<IAuthorizationHandler, BrandEmployeeAuthorizationHandler>();

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

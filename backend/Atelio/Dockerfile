# ---------- Build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restauration NuGet d'abord (mise en cache tant que les .csproj ne changent pas)
COPY Atelio.Api/Atelio.Api.csproj Atelio.Api/
COPY Atelio.Application/Atelio.Application.csproj Atelio.Application/
COPY Atelio.Domain/Atelio.Domain.csproj Atelio.Domain/
COPY Atelio.Infrastructure/Atelio.Infrastructure.csproj Atelio.Infrastructure/
RUN dotnet restore Atelio.Api/Atelio.Api.csproj

# Code source puis publication
COPY . .
RUN dotnet publish Atelio.Api/Atelio.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ---------- Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Utilisateur non-root fourni par l'image Microsoft
USER $APP_UID

ENTRYPOINT ["dotnet", "Atelio.Api.dll"]
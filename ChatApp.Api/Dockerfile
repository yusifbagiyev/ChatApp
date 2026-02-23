# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["ChatApp.Api/ChatApp.Api.csproj", "ChatApp.Api/"]
COPY ["ChatApp.Modules.Channels.Api/ChatApp.Modules.Channels.Api.csproj", "ChatApp.Modules.Channels.Api/"]
COPY ["ChatApp.Modules.Channels.Application/ChatApp.Modules.Channels.Application.csproj", "ChatApp.Modules.Channels.Application/"]
COPY ["ChatApp.Modules.Channels.Domain/ChatApp.Modules.Channels.Domain.csproj", "ChatApp.Modules.Channels.Domain/"]
COPY ["ChatApp.Shared.Kernel/ChatApp.Shared.Kernel.csproj", "ChatApp.Shared.Kernel/"]
COPY ["ChatApp.Shared.Infrastructure/ChatApp.Shared.Infrastructure.csproj", "ChatApp.Shared.Infrastructure/"]
COPY ["ChatApp.Modules.Identity.Application/ChatApp.Modules.Identity.Application.csproj", "ChatApp.Modules.Identity.Application/"]
COPY ["ChatApp.Modules.Identity.Domain/ChatApp.Modules.Identity.Domain.csproj", "ChatApp.Modules.Identity.Domain/"]
COPY ["ChatApp.Modules.Channels.Infrastructure/ChatApp.Modules.Channels.Infrastructure.csproj", "ChatApp.Modules.Channels.Infrastructure/"]
COPY ["ChatApp.Modules.Files.Domain/ChatApp.Modules.Files.Domain.csproj", "ChatApp.Modules.Files.Domain/"]
COPY ["ChatApp.Modules.DirectMessages.Api/ChatApp.Modules.DirectMessages.Api.csproj", "ChatApp.Modules.DirectMessages.Api/"]
COPY ["ChatApp.Modules.DirectMessages.Application/ChatApp.Modules.DirectMessages.Application.csproj", "ChatApp.Modules.DirectMessages.Application/"]
COPY ["ChatApp.Modules.DirectMessages.Domain/ChatApp.Modules.DirectMessages.Domain.csproj", "ChatApp.Modules.DirectMessages.Domain/"]
COPY ["ChatApp.Modules.DirectMessages.Infrastructure/ChatApp.Modules.DirectMessages.Infrastructure.csproj", "ChatApp.Modules.DirectMessages.Infrastructure/"]
COPY ["ChatApp.Modules.Files.Api/ChatApp.Modules.Files.Api.csproj", "ChatApp.Modules.Files.Api/"]
COPY ["ChatApp.Modules.Files.Application/ChatApp.Modules.Files.Application.csproj", "ChatApp.Modules.Files.Application/"]
COPY ["ChatApp.Modules.Files.Infrastructure/ChatApp.Modules.Files.Infrastructure.csproj", "ChatApp.Modules.Files.Infrastructure/"]
COPY ["ChatApp.Modules.Identity.Api/ChatApp.Modules.Identity.Api.csproj", "ChatApp.Modules.Identity.Api/"]
COPY ["ChatApp.Modules.Identity.Infrastructure/ChatApp.Modules.Identity.Infrastructure.csproj", "ChatApp.Modules.Identity.Infrastructure/"]
COPY ["ChatApp.Modules.Notifications.Api/ChatApp.Modules.Notifications.Api.csproj", "ChatApp.Modules.Notifications.Api/"]
COPY ["ChatApp.Modules.Notifications.Application/ChatApp.Modules.Notifications.Application.csproj", "ChatApp.Modules.Notifications.Application/"]
COPY ["ChatApp.Modules.Notifications.Domain/ChatApp.Modules.Notifications.Domain.csproj", "ChatApp.Modules.Notifications.Domain/"]
COPY ["ChatApp.Modules.Notifications.Infrastructure/ChatApp.Modules.Notifications.Infrastructure.csproj", "ChatApp.Modules.Notifications.Infrastructure/"]
COPY ["ChatApp.Modules.Search.Api/ChatApp.Modules.Search.Api.csproj", "ChatApp.Modules.Search.Api/"]
COPY ["ChatApp.Modules.Search.Application/ChatApp.Modules.Search.Application.csproj", "ChatApp.Modules.Search.Application/"]
COPY ["ChatApp.Modules.Search.Domain/ChatApp.Modules.Search.Domain.csproj", "ChatApp.Modules.Search.Domain/"]
COPY ["ChatApp.Modules.Search.Infrastructure/ChatApp.Modules.Search.Infrastructure.csproj", "ChatApp.Modules.Search.Infrastructure/"]
COPY ["ChatApp.Modules.Settings.Api/ChatApp.Modules.Settings.Api.csproj", "ChatApp.Modules.Settings.Api/"]
COPY ["ChatApp.Modules.Settings.Application/ChatApp.Modules.Settings.Application.csproj", "ChatApp.Modules.Settings.Application/"]
COPY ["ChatApp.Modules.Settings.Domain/ChatApp.Modules.Settings.Domain.csproj", "ChatApp.Modules.Settings.Domain/"]
COPY ["ChatApp.Modules.Settings.Infrastructure/ChatApp.Modules.Settings.Infrastructure.csproj", "ChatApp.Modules.Settings.Infrastructure/"]
RUN dotnet restore "./ChatApp.Api/ChatApp.Api.csproj"
COPY . .
WORKDIR "/src/ChatApp.Api"
RUN dotnet build "./ChatApp.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ChatApp.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app

# Uploads directory yarat — non-root user yazma icazəsi üçün
USER root
RUN mkdir -p /app/uploads && chown -R 1654:1654 /app/uploads
USER $APP_UID

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ChatApp.Api.dll"]
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace ChatApp.Shared.Infrastructure.SignalR.Services
{
    /// <summary>
    /// Returns all user IDs that share a channel or active DM conversation with the given user.
    /// Uses raw SQL for cross-module read (avoids module DbContext coupling).
    /// Results cached in-memory for 2 minutes to avoid DB hit on every connect/disconnect.
    /// </summary>
    public class UserRelationProvider : IUserRelationProvider
    {
        private readonly string _connectionString;
        private readonly IMemoryCache _cache;
        private readonly ILogger<UserRelationProvider> _logger;
        private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(2);

        // Single query: union of channel co-members and active DM conversation partners
        private const string RelatedUsersSql = @"
            SELECT DISTINCT cm2.user_id
            FROM channel_members cm1
            JOIN channel_members cm2 ON cm1.channel_id = cm2.channel_id
            WHERE cm1.user_id = @userId AND cm2.user_id != @userId
            UNION
            SELECT dcm2.user_id
            FROM direct_conversation_members dcm1
            JOIN direct_conversation_members dcm2 ON dcm1.conversation_id = dcm2.conversation_id
            WHERE dcm1.user_id = @userId AND dcm2.user_id != @userId
              AND dcm1.is_active = true AND dcm2.is_active = true";

        public UserRelationProvider(
            IConfiguration configuration,
            IMemoryCache cache,
            ILogger<UserRelationProvider> logger)
        {
            _connectionString = configuration.GetConnectionString("IdentityDb")
                ?? throw new ArgumentNullException("IdentityDb connection string not found");
            _cache = cache;
            _logger = logger;
        }

        public async Task<List<Guid>> GetRelatedUserIdsAsync(Guid userId)
        {
            var cacheKey = $"related_users_{userId}";

            if (_cache.TryGetValue(cacheKey, out List<Guid>? cached) && cached != null)
                return cached;

            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new NpgsqlCommand(RelatedUsersSql, conn);
                cmd.Parameters.AddWithValue("userId", userId);

                var userIds = new List<Guid>();
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    userIds.Add(reader.GetGuid(0));
                }

                _cache.Set(cacheKey, userIds, new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(_cacheExpiration));

                return userIds;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load related users for {UserId}, falling back to empty list", userId);
                return new List<Guid>();
            }
        }
    }
}

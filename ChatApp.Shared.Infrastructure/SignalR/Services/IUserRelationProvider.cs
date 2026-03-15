namespace ChatApp.Shared.Infrastructure.SignalR.Services
{
    /// <summary>
    /// Provides related user IDs for targeted presence broadcasts.
    /// Returns users who share a channel or DM conversation with the given user.
    /// Used by ChatHub to send UserOnline/UserOffline only to relevant users
    /// instead of Clients.All (which wastes bandwidth at scale).
    /// </summary>
    public interface IUserRelationProvider
    {
        Task<List<Guid>> GetRelatedUserIdsAsync(Guid userId);
    }
}

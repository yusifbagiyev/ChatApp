using ChatApp.Modules.Channels.Domain.Events;
using ChatApp.Shared.Infrastructure.SignalR.Services;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.Channels.Application.Events
{
    /// <summary>
    /// Handles MemberRemovedEvent - notifies channel members via SignalR when a member leaves
    /// </summary>
    public class MemberRemovedEventHandler(
        ISignalRNotificationService signalRNotificationService,
        IChannelMemberCache channelMemberCache,
        ILogger<MemberRemovedEventHandler> logger)
    {
        public async Task HandleAsync(MemberRemovedEvent @event)
        {
            try
            {
                // Get the display name of the user who left
                // TODO: Add user service reference or include display name in event
                var leftUserFullName = @event.UserId.ToString(); // Placeholder

                // Get remaining channel members from cache
                var memberUserIds = await channelMemberCache.GetChannelMemberIdsAsync(@event.ChannelId);

                // Notify remaining members directly
                await signalRNotificationService.NotifyMemberLeftChannelToMembersAsync(
                    @event.ChannelId,
                    memberUserIds,
                    @event.UserId,
                    leftUserFullName);
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Error handling MemberRemovedEvent for user {UserId} in channel {ChannelId}",
                    @event.UserId,
                    @event.ChannelId);
            }
        }
    }
}
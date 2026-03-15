using ChatApp.Shared.Infrastructure.SignalR.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ChatApp.Shared.Infrastructure.SignalR.Hubs
{
    /// <summary>
    /// Main SignalR hub for real-time chat functionality
    /// </summary>
    [Authorize]
    public class ChatHub:Hub
    {
        private readonly IConnectionManager _connectionManager;
        private readonly IPresenceService _presenceService;
        private readonly ISignalRNotificationService _signalRNotificationService;
        private readonly IChannelMemberCache _channelMemberCache;
        private readonly IUserRelationProvider _userRelationProvider;

        public ChatHub(
            IConnectionManager connectionManager,
            IPresenceService presenceService,
            ISignalRNotificationService signalRNotificationService,
            IChannelMemberCache channelMemberCache,
            IUserRelationProvider userRelationProvider)
        {
            _connectionManager= connectionManager;
            _presenceService= presenceService;
            _signalRNotificationService = signalRNotificationService;
            _channelMemberCache = channelMemberCache;
            _userRelationProvider = userRelationProvider;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();

            if (userId != Guid.Empty)
            {
                await _connectionManager.AddConnectionAsync(userId, Context.ConnectionId);
                await _presenceService.UserConnectedAsync(userId, Context.ConnectionId);

                // Notify only related users (channel co-members + DM partners) about user coming online
                await NotifyPresenceToRelatedUsersAsync(userId, "UserOnline");
            }
            await base.OnConnectedAsync();
        }


        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();

            if(userId!= Guid.Empty)
            {
                await _connectionManager.RemoveConnectionAsync(Context.ConnectionId);
                await _presenceService.UserDisconnectedAsync(Context.ConnectionId);

                // Check if user is still online on other devices
                var isStillOnline = await _connectionManager.IsUserOnlineAsync(userId);

                if (!isStillOnline)
                {
                    // Notify only related users about user going offline
                    await NotifyPresenceToRelatedUsersAsync(userId, "UserOffline");
                }
            }
            await base.OnDisconnectedAsync(exception);
        }


        /// <summary>
        /// Client notifies they are typing in a channel
        /// Uses hybrid pattern: broadcasts to group (for active viewers) AND direct connections (for lazy loading)
        /// </summary>
        public async Task TypingInChannel(Guid channelId,bool isTyping)
        {
            var userId = GetUserId();

            if (userId == Guid.Empty)
                return;

            var fullName = GetFullName(); // ClaimTypes.Name now contains FullName

            // Get channel members from cache
            var memberUserIds = await _channelMemberCache.GetChannelMemberIdsAsync(channelId);

            // Exclude sender from member list
            var recipientUserIds = memberUserIds.Where(id => id != userId).ToList();

            if (recipientUserIds.Any())
            {
                // HYBRID BROADCAST: Send to both group AND direct connections
                // This allows typing indicators to work even without JOIN (lazy loading)
                await _signalRNotificationService.NotifyUserTypingInChannelToMembersAsync(
                    channelId,
                    recipientUserIds,
                    userId,
                    fullName,
                    isTyping);
            }
            else
            {
                // Fallback: If cache is empty, broadcast to group EXCLUDING caller
                // OthersInGroup — sender-ə göndərmir (sender öz typing-ini görməsin)
                await Clients.OthersInGroup($"channel_{channelId}").SendAsync(
                    "UserTypingInChannel",
                    channelId,
                    userId,
                    fullName,
                    isTyping);
            }
        }


        /// <summary>
        /// Client notifies they are typing in a direct conversation
        /// Uses hybrid pattern: broadcasts to group AND directly to recipient
        /// </summary>
        public async Task TypingInConversation(Guid conversationId, Guid recipientUserId, bool isTyping)
        {
            var userId = GetUserId();

            if (userId == Guid.Empty) return;

            // HYBRID BROADCAST: Send to both group AND direct connection
            // This allows typing indicators to work even without JOIN (lazy loading)
            await _signalRNotificationService.NotifyUserTypingInConversationToMembersAsync(
                conversationId,
                new List<Guid> { recipientUserId },
                userId,
                isTyping);
        }


        /// <summary>
        /// Join a channel group for real-time updates
        /// </summary>
        public async Task JoinChannel(Guid channelId)
        {
            var userId = GetUserId();

            if(userId == Guid.Empty) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"channel_{channelId}");
        }



        /// <summary>
        /// Leave a channel group
        /// </summary>
        public async Task LeaveChannel(Guid channelId)
        {
            var userId = GetUserId();

            if(userId == Guid.Empty) return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"channel_{channelId}");
        }



        /// <summary>
        /// Join a conversation group for real-time updates
        /// </summary>
        public async Task JoinConversation(Guid conversationId)
        {
            var userId = GetUserId();

            if(userId == Guid.Empty) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        }


        /// <summary>
        /// Leave a conversation group
        /// </summary>
        public async Task LeaveConversation(Guid conversationId)
        {
            var userId = GetUserId();

            if (userId == Guid.Empty)
                return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        }



        /// <summary>
        /// Get online status for a list of users
        /// </summary>
        public async Task<Dictionary<Guid, bool>> GetOnlineStatus(List<Guid> userIds)
        {
            return await _presenceService.GetUsersOnlineStatusAsync(userIds);
        }


        /// <summary>
        /// Sends presence event only to users who share a channel or DM conversation.
        /// Replaces Clients.All broadcast — reduces network traffic from O(N) to O(related).
        /// </summary>
        private async Task NotifyPresenceToRelatedUsersAsync(Guid userId, string eventName)
        {
            var relatedUserIds = await _userRelationProvider.GetRelatedUserIdsAsync(userId);

            if (relatedUserIds.Count == 0) return;

            // Collect connections of all related users who are currently online
            var allConnections = new List<string>();
            foreach (var relatedUserId in relatedUserIds)
            {
                var connections = await _connectionManager.GetUserConnectionsAsync(relatedUserId);
                allConnections.AddRange(connections);
            }

            if (allConnections.Count > 0)
            {
                await Clients.Clients(allConnections).SendAsync(eventName, userId);
            }
        }

        private Guid GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Guid.Empty;
            }

            return userId;
        }

        private string GetFullName()
        {
            // JWT-da "name" claim key istifadə olunur (JwtRegisteredClaimNames.Name = "name"),
            // ClaimTypes.Name isə fərqli key-dir ("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")
            return Context.User?.FindFirst("name")?.Value
                ?? Context.User?.FindFirst(ClaimTypes.Name)?.Value
                ?? "Someone";
        }
    }
}
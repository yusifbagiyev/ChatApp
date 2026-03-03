namespace ChatApp.Modules.Channels.Application.DTOs.Requests
{
    public record AddMemberRequest(Guid UserId, bool ShowChatHistory = true);
}
namespace ChatApp.Modules.Search.Application.DTOs.Responses
{
    public record ChannelMemberReadModel
    {
        public Guid Id { get; set; }
        public Guid ChannelId { get; set; }
        public Guid UserId { get; set; }
    }
}
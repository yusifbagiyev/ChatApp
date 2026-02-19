using ChatApp.Modules.Channels.Application.DTOs.Responses;
using ChatApp.Modules.Channels.Application.Interfaces;
using ChatApp.Shared.Kernel.Common;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.Channels.Application.Queries.GetMessageReactions
{
    public record GetMessageReactionsQuery(
        Guid MessageId,
        Guid ChannelId,
        Guid RequestedBy
    ) : IRequest<Result<List<ChannelMessageReactionDto>>>;

    public class GetMessageReactionsQueryHandler : IRequestHandler<GetMessageReactionsQuery, Result<List<ChannelMessageReactionDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<GetMessageReactionsQueryHandler> _logger;

        public GetMessageReactionsQueryHandler(
            IUnitOfWork unitOfWork,
            ILogger<GetMessageReactionsQueryHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Result<List<ChannelMessageReactionDto>>> Handle(
            GetMessageReactionsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Verify channel exists
                var channel = await _unitOfWork.Channels.GetByIdAsync(
                    request.ChannelId,
                    cancellationToken);

                if (channel == null)
                {
                    return Result.Failure<List<ChannelMessageReactionDto>>("Channel not found");
                }

                // Verify user is a member
                var isMember = await _unitOfWork.Channels.IsUserMemberAsync(
                    request.ChannelId,
                    request.RequestedBy,
                    cancellationToken);

                if (!isMember)
                {
                    return Result.Failure<List<ChannelMessageReactionDto>>("You must be a member to view reactions");
                }

                var reactions = await _unitOfWork.ChannelMessageReactions
                    .GetMessageReactionsWithUserDetailsAsync(request.MessageId, cancellationToken);

                return Result.Success(reactions);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error retrieving reactions for message {MessageId}", request.MessageId);
                return Result.Failure<List<ChannelMessageReactionDto>>("An error occurred while retrieving reactions");
            }
        }
    }
}

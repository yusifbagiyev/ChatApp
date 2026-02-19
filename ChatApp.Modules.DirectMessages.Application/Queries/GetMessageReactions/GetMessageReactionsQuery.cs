using ChatApp.Modules.DirectMessages.Application.Commands.DirectMessageReactions;
using ChatApp.Modules.DirectMessages.Application.Interfaces;
using ChatApp.Shared.Kernel.Common;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.DirectMessages.Application.Queries.GetMessageReactions
{
    public record GetMessageReactionsQuery(
        Guid MessageId,
        Guid ConversationId,
        Guid RequestedBy
    ) : IRequest<Result<List<ReactionSummary>>>;

    public class GetMessageReactionsQueryHandler : IRequestHandler<GetMessageReactionsQuery, Result<List<ReactionSummary>>>
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

        public async Task<Result<List<ReactionSummary>>> Handle(
            GetMessageReactionsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Verify user is participant in the conversation
                var conversation = await _unitOfWork.Conversations.GetByIdAsync(
                    request.ConversationId,
                    cancellationToken);

                if (conversation == null)
                {
                    return Result.Failure<List<ReactionSummary>>("Conversation not found");
                }

                if (!conversation.IsParticipant(request.RequestedBy))
                {
                    return Result.Failure<List<ReactionSummary>>("You are not part of this conversation");
                }

                var reactions = await _unitOfWork.Reactions
                    .GetMessageReactionsWithUserDetailsAsync(request.MessageId, cancellationToken);

                return Result.Success(reactions);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error retrieving reactions for message {MessageId}", request.MessageId);
                return Result.Failure<List<ReactionSummary>>("An error occurred while retrieving reactions");
            }
        }
    }
}

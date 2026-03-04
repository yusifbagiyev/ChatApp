using ChatApp.Modules.DirectMessages.Application.Interfaces;
using ChatApp.Shared.Kernel.Common;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.DirectMessages.Application.Commands.DirectConversations
{
    public record HideConversationCommand(
        Guid ConversationId,
        Guid UserId
    ) : IRequest<Result<bool>>; // Returns true if hidden, false if unhidden

    public class HideConversationCommandValidator : AbstractValidator<HideConversationCommand>
    {
        public HideConversationCommandValidator()
        {
            RuleFor(x => x.ConversationId)
                .NotEmpty().WithMessage("Conversation ID is required");

            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required");
        }
    }

    public class HideConversationCommandHandler : IRequestHandler<HideConversationCommand, Result<bool>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<HideConversationCommandHandler> _logger;

        public HideConversationCommandHandler(
            IUnitOfWork unitOfWork,
            ILogger<HideConversationCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Result<bool>> Handle(
            HideConversationCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var conversation = await _unitOfWork.Conversations.GetByIdAsync(
                    request.ConversationId,
                    cancellationToken);

                if (conversation == null)
                    return Result.Failure<bool>("Conversation not found");

                if (!conversation.IsParticipant(request.UserId))
                    return Result.Failure<bool>("User is not a participant in this conversation");

                var member = await _unitOfWork.ConversationMembers.GetByConversationAndUserAsync(
                    request.ConversationId,
                    request.UserId,
                    cancellationToken);

                if (member == null)
                    return Result.Failure<bool>("Conversation member not found");

                if (member.IsHidden)
                {
                    // Artıq gizlidirsə — unhide et
                    member.Unhide();
                }
                else
                {
                    // Mesaj yoxdursa hide etmək olmaz
                    if (!conversation.HasMessages)
                        return Result.Failure<bool>("Cannot hide conversation without messages");

                    member.Hide();
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger?.LogInformation(
                    "Conversation {ConversationId} hide toggled to {IsHidden} for user {UserId}",
                    request.ConversationId,
                    member.IsHidden,
                    request.UserId);

                return Result.Success(member.IsHidden);
            }
            catch (Exception ex)
            {
                _logger?.LogError(
                    ex,
                    "Error toggling hide for conversation {ConversationId} by user {UserId}",
                    request.ConversationId,
                    request.UserId);
                return Result.Failure<bool>(ex.Message);
            }
        }
    }
}

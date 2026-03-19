using ChatApp.Modules.DirectMessages.Application.Interfaces;
using ChatApp.Modules.DirectMessages.Domain.Entities;
using ChatApp.Shared.Infrastructure.SignalR.Services;
using ChatApp.Shared.Kernel.Common;
using ChatApp.Shared.Kernel.Exceptions;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.DirectMessages.Application.Commands.DirectMessageReactions
{
    public record ToggleReactionCommand(
        Guid MessageId,
        Guid UserId,
        string Reaction
    ) : IRequest<Result<List<ReactionSummary>>>;

    public record ReactionSummary(
        string Emoji,
        int Count,
        List<Guid> UserIds,
        List<string> UserFullNames,
        List<string?> UserAvatarUrls
    );

    public class ToggleReactionCommandValidator : AbstractValidator<ToggleReactionCommand>
    {
        public ToggleReactionCommandValidator()
        {
            RuleFor(x => x.MessageId)
                .NotEmpty().WithMessage("Message ID is required");

            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required");

            RuleFor(x => x.Reaction)
                .NotEmpty().WithMessage("Reaction cannot be empty")
                .MaximumLength(10).WithMessage("Reaction must be a single emoji");
        }
    }

    public class ToggleReactionCommandHandler : IRequestHandler<ToggleReactionCommand, Result<List<ReactionSummary>>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ISignalRNotificationService _signalRNotificationService;
        private readonly ILogger<ToggleReactionCommandHandler> _logger;

        public ToggleReactionCommandHandler(
            IUnitOfWork unitOfWork,
            ISignalRNotificationService signalRNotificationService,
            ILogger<ToggleReactionCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _signalRNotificationService = signalRNotificationService;
            _logger = logger;
        }

        public async Task<Result<List<ReactionSummary>>> Handle(
            ToggleReactionCommand request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Toggling reaction {Reaction} on message {MessageId} by user {UserId}",
                    request.Reaction,
                    request.MessageId,
                    request.UserId);

                var message = await _unitOfWork.Messages.GetByIdAsync(
                    request.MessageId,
                    cancellationToken)
                        ?? throw new NotFoundException($"Message with ID {request.MessageId} not found");

                // Prevent reactions on deleted messages
                if (message.IsDeleted)
                {
                    return Result.Failure<List<ReactionSummary>>("Cannot react to deleted messages");
                }

                // Verify user is participant in the conversation
                var conversation = await _unitOfWork.Conversations.GetByIdAsync(
                    message.ConversationId,
                    cancellationToken);

                if (conversation == null || !conversation.IsParticipant(request.UserId))
                {
                    return Result.Failure<List<ReactionSummary>>("You must be a participant to react to messages");
                }
               
                var existingReaction = await _unitOfWork.Reactions.GetReactionAsync(
                    request.MessageId,
                    request.UserId,
                    request.Reaction,
                    cancellationToken);

                if (existingReaction != null)
                {
                    // Remove reaction if it already exists (toggle off)
                    await _unitOfWork.Reactions.DeleteAsync(existingReaction, cancellationToken);
                }
                else
                {
                    var newReaction=new DirectMessageReaction(message.Id, request.UserId, request.Reaction);
                    await _unitOfWork.Reactions.AddAsync(newReaction, cancellationToken);
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Get updated reactions with user details
                var reactionSummary = await _unitOfWork.Reactions.GetMessageReactionsWithUserDetailsAsync(
                    request.MessageId,
                    cancellationToken);

                // Send real-time notification to other participant
                var otherUserId = conversation.GetOtherUserId(request.UserId);
                await _signalRNotificationService.NotifyUserAsync(
                    otherUserId,
                    "DirectMessageReactionToggled",
                    new
                    {
                        messageId = request.MessageId,
                        reactions = reactionSummary
                    });

                return Result.Success(reactionSummary);
            }
            catch (InvalidOperationException ex)
            {
                return Result.Failure<List<ReactionSummary>>(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error toggling reaction on message {MessageId}",
                    request.MessageId);
                return Result.Failure<List<ReactionSummary>>("An error occurred while toggling the reaction");
            }
        }
    }
}
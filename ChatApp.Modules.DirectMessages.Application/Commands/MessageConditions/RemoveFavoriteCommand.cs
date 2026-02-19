using ChatApp.Modules.DirectMessages.Application.Interfaces;
using ChatApp.Shared.Kernel.Common;
using ChatApp.Shared.Kernel.Exceptions;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.DirectMessages.Application.Commands.MessageConditions
{
    public record RemoveFavoriteCommand(
        Guid ConversationId,
        Guid MessageId,
        Guid RequestedBy
    ) : IRequest<Result>;

    public class RemoveFavoriteCommandValidator : AbstractValidator<RemoveFavoriteCommand>
    {
        public RemoveFavoriteCommandValidator()
        {
            RuleFor(x => x.ConversationId)
                .NotEmpty().WithMessage("Conversation ID is required");

            RuleFor(x => x.MessageId)
                .NotEmpty().WithMessage("Message ID is required");

            RuleFor(x => x.RequestedBy)
                .NotEmpty().WithMessage("Requester ID is required");
        }
    }

    public class RemoveFavoriteCommandHandler : IRequestHandler<RemoveFavoriteCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<RemoveFavoriteCommandHandler> _logger;

        public RemoveFavoriteCommandHandler(
            IUnitOfWork unitOfWork,
            ILogger<RemoveFavoriteCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Result> Handle(
            RemoveFavoriteCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var message = await _unitOfWork.Messages.GetByIdAsync(
                    request.MessageId,
                    cancellationToken);

                if (message == null)
                    throw new NotFoundException($"Message with ID {request.MessageId} not found");

                if (message.ConversationId != request.ConversationId)
                    return Result.Failure("Message does not belong to the specified conversation");

                var conversation = await _unitOfWork.Conversations.GetByIdAsync(
                    request.ConversationId,
                    cancellationToken);

                if (conversation == null)
                    throw new NotFoundException($"Conversation with ID {request.ConversationId} not found");

                if (!conversation.IsParticipant(request.RequestedBy))
                    return Result.Failure("User is not a participant in this conversation");

                // Favorite yoxdursa, idempotent olaraq uğurlu cavab qaytar
                var existingFavorite = await _unitOfWork.Favorites.GetAsync(
                    request.RequestedBy,
                    request.MessageId,
                    cancellationToken);

                if (existingFavorite == null)
                    return Result.Success();

                await _unitOfWork.Favorites.RemoveAsync(existingFavorite, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger?.LogInformation(
                    "Message {MessageId} removed from favorites for user {UserId}",
                    request.MessageId,
                    request.RequestedBy);

                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger?.LogError(
                    ex,
                    "Error removing favorite for message {MessageId} by user {UserId}",
                    request.MessageId,
                    request.RequestedBy);
                return Result.Failure(ex.Message);
            }
        }
    }
}

using ChatApp.Modules.Channels.Application.Interfaces;
using ChatApp.Modules.Channels.Domain.Entities;
using ChatApp.Shared.Kernel.Common;
using ChatApp.Shared.Kernel.Exceptions;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.Channels.Application.Commands.MessageConditions
{
    public record AddFavoriteCommand(
        Guid ChannelId,
        Guid MessageId,
        Guid RequestedBy
    ) : IRequest<Result>;

    public class AddFavoriteCommandValidator : AbstractValidator<AddFavoriteCommand>
    {
        public AddFavoriteCommandValidator()
        {
            RuleFor(x => x.ChannelId)
                .NotEmpty().WithMessage("Channel ID is required");

            RuleFor(x => x.MessageId)
                .NotEmpty().WithMessage("Message ID is required");

            RuleFor(x => x.RequestedBy)
                .NotEmpty().WithMessage("Requester ID is required");
        }
    }

    public class AddFavoriteCommandHandler : IRequestHandler<AddFavoriteCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<AddFavoriteCommandHandler> _logger;

        public AddFavoriteCommandHandler(
            IUnitOfWork unitOfWork,
            ILogger<AddFavoriteCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Result> Handle(
            AddFavoriteCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var message = await _unitOfWork.ChannelMessages.GetByIdAsync(
                    request.MessageId,
                    cancellationToken);

                if (message == null)
                    throw new NotFoundException($"Message with ID {request.MessageId} not found");

                if (message.ChannelId != request.ChannelId)
                    return Result.Failure("Message does not belong to the specified channel");

                if (message.IsDeleted)
                    return Result.Failure("Cannot add deleted messages to favorites");

                var member = await _unitOfWork.ChannelMembers.GetMemberAsync(
                    request.ChannelId,
                    request.RequestedBy,
                    cancellationToken);

                if (member == null)
                    return Result.Failure("User is not a member of this channel");

                // Artıq favorited-dirsə, idempotent olaraq uğurlu cavab qaytar
                var alreadyFavorited = await _unitOfWork.Favorites.IsFavoriteAsync(
                    request.RequestedBy,
                    request.MessageId,
                    cancellationToken);

                if (alreadyFavorited)
                    return Result.Success();

                var favorite = new UserFavoriteChannelMessage(request.RequestedBy, request.MessageId);
                await _unitOfWork.Favorites.AddAsync(favorite, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger?.LogInformation(
                    "Message {MessageId} added to favorites for user {UserId}",
                    request.MessageId,
                    request.RequestedBy);

                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger?.LogError(
                    ex,
                    "Error adding favorite for message {MessageId} by user {UserId}",
                    request.MessageId,
                    request.RequestedBy);
                return Result.Failure(ex.Message);
            }
        }
    }
}

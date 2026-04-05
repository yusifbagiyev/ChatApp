using ChatApp.Modules.Channels.Application.Interfaces;
using ChatApp.Modules.Channels.Domain.Enums;
using ChatApp.Modules.Channels.Domain.Events;
using ChatApp.Shared.Infrastructure.SignalR.Services;
using ChatApp.Shared.Kernel.Common;
using ChatApp.Shared.Kernel.Exceptions;
using ChatApp.Shared.Kernel.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.Channels.Application.Commands.ChannelMembers
{
    public record RemoveMemberCommand(
        Guid ChannelId,
        Guid UserId,
        Guid RemovedBy
    ) : IRequest<Result>;



    public class RemoveMemberCommandValidator : AbstractValidator<RemoveMemberCommand>
    {
        public RemoveMemberCommandValidator()
        {
            RuleFor(x => x.ChannelId)
                .NotEmpty().WithMessage("Channel ID is required");

            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required");

            RuleFor(x => x.RemovedBy)
                .NotEmpty().WithMessage("Removed by user ID is required");
        }
    }



    public class RemoveMemberCommandHandler : IRequestHandler<RemoveMemberCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEventBus _eventBus;
        private readonly ISignalRNotificationService _notificationService;
        private readonly ILogger<RemoveMemberCommandHandler> _logger;

        public RemoveMemberCommandHandler(
            IUnitOfWork unitOfWork,
            IEventBus eventBus,
            ISignalRNotificationService notificationService,
            ILogger<RemoveMemberCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _eventBus = eventBus;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<Result> Handle(
            RemoveMemberCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger?.LogInformation(
                    "Removing user {UserId} from channel {ChannelId}",
                    request.UserId,
                    request.ChannelId);

                var channel = await _unitOfWork.Channels.GetByIdAsync(
                    request.ChannelId,
                    cancellationToken)
                    
                    ?? throw new NotFoundException($"Channel with ID {request.ChannelId} not found");

                // Get member to remove
                var member = await _unitOfWork.ChannelMembers.GetMemberAsync(
                    request.ChannelId,
                    request.UserId,
                    cancellationToken);

                if (member == null)
                {
                    return Result.Failure("User is not a member of this channel");
                }

                // Cannot remove owner
                if (member.Role == MemberRole.Owner)
                {
                    return Result.Failure("Cannot remove channel owner. Transfer ownership first.");
                }

                // Check requester permission
                var requesterRole = await _unitOfWork.ChannelMembers.GetUserRoleAsync(
                    request.ChannelId,
                    request.RemovedBy,
                    cancellationToken);

                if (requesterRole == null || (requesterRole != MemberRole.Admin && requesterRole != MemberRole.Owner))
                {
                    return Result.Failure("You don't have permission to remove members");
                }

                // Admin digər admin-i çıxara bilməz — yalnız Owner edə bilər
                if (requesterRole == MemberRole.Admin && member.Role == MemberRole.Admin)
                {
                    return Result.Failure("Only the channel owner can remove administrators");
                }

                // Hard-delete: sətri DB-dən sil (mesajlar ayrı cədvəldədir, toxunulmur)
                await _unitOfWork.ChannelMembers.DeleteAsync(member, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Publish event
                await _eventBus.PublishAsync(
                    new MemberRemovedEvent(request.ChannelId, request.UserId, request.RemovedBy),
                    cancellationToken);

                // Qalan üzvlərə member dəyişikliyi bildirişi göndər
                var remainingMembers = await _unitOfWork.ChannelMembers.GetChannelMembersAsync(
                    request.ChannelId, cancellationToken);
                var remainingMemberIds = remainingMembers.Select(m => m.UserId).ToList();
                if (remainingMemberIds.Count > 0)
                {
                    await _notificationService.NotifyChannelMemberChangedAsync(
                        request.ChannelId,
                        remainingMemberIds,
                        new { channelId = request.ChannelId, userId = request.UserId, action = "removed", memberCount = remainingMemberIds.Count });
                }

                _logger?.LogInformation(
                    "User {UserId} removed from channel {ChannelId} successfully",
                    request.UserId,
                    request.ChannelId);

                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger?.LogError(
                    ex,
                    "Error removing user {UserId} from channel {ChannelId}",
                    request.UserId,
                    request.ChannelId);
                return Result.Failure(ex.Message);
            }
        }
    }
}
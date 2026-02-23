using ChatApp.Modules.Channels.Application.Interfaces;
using ChatApp.Modules.Channels.Domain.Entities;
using ChatApp.Modules.Channels.Domain.Enums;
using ChatApp.Modules.Channels.Domain.Events;
using ChatApp.Modules.Channels.Domain.ValueObjects;
using ChatApp.Shared.Infrastructure.SignalR.Services;
using ChatApp.Shared.Kernel.Common;
using ChatApp.Shared.Kernel.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.Channels.Application.Commands.Channels
{
    public record CreateChannelCommand(
        string Name,
        string? Description,
        ChannelType Type,
        Guid CreatedBy,
        List<Guid>? MemberIds = null
    ) : IRequest<Result<object>>;



    public class CreateChannelCommandValidator : AbstractValidator<CreateChannelCommand>
    {
        public CreateChannelCommandValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Channel name is required")
                .MaximumLength(100).WithMessage("Channel name must not exceed 100 characters");

            When(x => !string.IsNullOrWhiteSpace(x.Description), () =>
            {
                RuleFor(x => x.Description)
                    .MaximumLength(500).WithMessage("Description must not exceed 500 characters");
            });

            RuleFor(x => x.Type)
                .IsInEnum().WithMessage("Invalid channel type");

            RuleFor(x => x.CreatedBy)
                .NotEmpty().WithMessage("Creator ID is required");
        }
    }



    public class CreateChannelCommandHandler : IRequestHandler<CreateChannelCommand, Result<object>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEventBus _eventBus;
        private readonly ISignalRNotificationService _notificationService;
        private readonly ILogger<CreateChannelCommandHandler> _logger;

        public CreateChannelCommandHandler(
            IUnitOfWork unitOfWork,
            IEventBus eventBus,
            ISignalRNotificationService notificationService,
            ILogger<CreateChannelCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _eventBus = eventBus;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<Result<object>> Handle(
            CreateChannelCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger?.LogInformation("Creating channel: {ChannelName}", request.Name);
                var channelName = ChannelName.Create(request.Name);

                // Check if channel name already exists
                var existingChannel = await _unitOfWork.Channels.GetByNameAsync(
                    channelName,
                    cancellationToken);

                if (existingChannel != null)
                {
                    _logger?.LogWarning("Channel name {ChannelName} already exists", request.Name);
                    return Result.Failure<object>("A channel with this name already exists");
                }

                await _unitOfWork.BeginTransactionAsync(cancellationToken);

                // Create channel (constructor auto-adds creator as Owner)
                var channel = new Channel(
                    channelName,
                    request.Description,
                    request.Type,
                    request.CreatedBy);

                await _unitOfWork.Channels.AddAsync(channel, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Add members (creator xaric — artıq constructor-da Owner kimi əlavə olunub)
                var addedMemberIds = new List<Guid>();

                if (request.MemberIds?.Count > 0)
                {
                    foreach (var userId in request.MemberIds.Where(id => id != request.CreatedBy).Distinct())
                    {
                        var member = new ChannelMember(channel.Id, userId, MemberRole.Member);
                        await _unitOfWork.ChannelMembers.AddAsync(member, cancellationToken);
                        addedMemberIds.Add(userId);
                    }

                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }

                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                // Publish event
                await _eventBus.PublishAsync(
                    new ChannelCreatedEvent(channel.Id, channelName, request.CreatedBy),
                    cancellationToken);

                // Build channel DTO — AddMemberCommand-dakı eyni format
                var memberCount = 1 + addedMemberIds.Count; // owner + members
                var channelDto = new
                {
                    Id = channel.Id,
                    Name = channel.Name,
                    Description = channel.Description,
                    Type = (int)channel.Type,
                    CreatedBy = channel.CreatedBy,
                    MemberCount = memberCount,
                    IsArchived = false,
                    CreatedAtUtc = channel.CreatedAtUtc,
                    ArchivedAtUtc = (DateTime?)null,
                    AvatarUrl = channel.AvatarUrl,
                    LastMessageContent = (string?)null,
                    LastMessageAtUtc = (DateTime?)null,
                    UnreadCount = 0,
                    HasUnreadMentions = false,
                    LastReadLaterMessageId = (Guid?)null,
                    LastMessageId = (Guid?)null,
                    LastMessageSenderId = (Guid?)null,
                    LastMessageStatus = (string?)null,
                    LastMessageSenderAvatarUrl = (string?)null,
                    FirstUnreadMessageId = (Guid?)null,
                    IsPinned = false,
                    IsMuted = false,
                    IsMarkedReadLater = false
                };

                // Notify each added member via SignalR
                foreach (var userId in addedMemberIds)
                {
                    await _notificationService.NotifyMemberAddedToChannelAsync(userId, channelDto);
                }

                _logger?.LogInformation(
                    "Channel {ChannelName} created with ID {ChannelId} and {MemberCount} members",
                    channelName,
                    channel.Id,
                    memberCount);

                return Result.Success<object>(channelDto);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                _logger?.LogError(ex, "Error creating channel {ChannelName}", request.Name);
                return Result.Failure<object>("An error occurred while creating the channel");
            }
        }
    }
}
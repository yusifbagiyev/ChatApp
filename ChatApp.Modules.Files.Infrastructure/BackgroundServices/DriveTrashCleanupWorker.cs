using ChatApp.Modules.Files.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ChatApp.Modules.Files.Infrastructure.BackgroundServices
{
    /// <summary>
    /// Recycle bin-dəki 30 gündən köhnə faylları avtomatik silən background servis.
    /// Hər 6 saatdan bir işləyir, batch-lərlə təmizləyir.
    /// </summary>
    public class DriveTrashCleanupWorker(
        IServiceProvider serviceProvider,
        ILogger<DriveTrashCleanupWorker> logger) : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromHours(6);
        private const int BatchSize = 100;

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("DriveTrashCleanupWorker started — interval: {Interval}", Interval);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredItemsAsync(stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogError(ex, "DriveTrashCleanupWorker encountered an error");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }

        private async Task CleanupExpiredItemsAsync(CancellationToken cancellationToken)
        {
            using var scope = serviceProvider.CreateScope();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var fileStorage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();

            var totalFilesDeleted = 0;
            var totalFoldersDeleted = 0;

            // Batch loop — expired faylları təmizlə
            while (!cancellationToken.IsCancellationRequested)
            {
                var expiredFiles = await unitOfWork.Files
                    .GetExpiredDeletedDriveFilesAsync(BatchSize, cancellationToken);

                if (expiredFiles.Count == 0) break;

                foreach (var file in expiredFiles)
                {
                    try
                    {
                        await fileStorage.DeleteFileAsync(file.StoragePath, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to delete file from disk: {Path}", file.StoragePath);
                    }

                    await unitOfWork.Files.DeleteAsync(file, cancellationToken);
                }

                await unitOfWork.SaveChangesAsync(cancellationToken);
                totalFilesDeleted += expiredFiles.Count;

                // Son batch tam deyilsə, daha yoxdur
                if (expiredFiles.Count < BatchSize) break;
            }

            // Expired folder-ləri təmizlə
            while (!cancellationToken.IsCancellationRequested)
            {
                var expiredFolders = await unitOfWork.DriveFolders
                    .GetExpiredDeletedFoldersAsync(BatchSize, cancellationToken);

                if (expiredFolders.Count == 0) break;

                foreach (var folder in expiredFolders)
                {
                    await unitOfWork.DriveFolders.DeleteAsync(folder, cancellationToken);
                }

                await unitOfWork.SaveChangesAsync(cancellationToken);
                totalFoldersDeleted += expiredFolders.Count;

                if (expiredFolders.Count < BatchSize) break;
            }

            if (totalFilesDeleted > 0 || totalFoldersDeleted > 0)
            {
                logger.LogInformation(
                    "DriveTrashCleanup completed — {Files} files, {Folders} folders permanently deleted",
                    totalFilesDeleted, totalFoldersDeleted);
            }
        }
    }
}

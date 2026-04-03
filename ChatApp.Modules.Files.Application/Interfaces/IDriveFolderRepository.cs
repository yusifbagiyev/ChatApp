using ChatApp.Modules.Files.Domain.Entities;

namespace ChatApp.Modules.Files.Application.Interfaces
{
    public interface IDriveFolderRepository
    {
        Task<DriveFolder?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<List<DriveFolder>> GetChildrenAsync(Guid ownerId, Guid? parentFolderId, CancellationToken cancellationToken = default);
        Task<List<DriveFolder>> SearchAsync(Guid ownerId, string search, CancellationToken cancellationToken = default);
        Task<List<DriveFolder>> GetDeletedFoldersAsync(Guid ownerId, CancellationToken cancellationToken = default);
        Task<List<DriveFolder>> GetAllDescendantsAsync(Guid folderId, CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(Guid id, Guid ownerId, CancellationToken cancellationToken = default);
        Task AddAsync(DriveFolder folder, CancellationToken cancellationToken = default);
        Task UpdateAsync(DriveFolder folder, CancellationToken cancellationToken = default);
        Task<int> GetItemCountAsync(Guid folderId, CancellationToken cancellationToken = default);
        Task DeleteAsync(DriveFolder folder, CancellationToken cancellationToken = default);
        /// <summary>
        /// 30 gündən çox recycle bin-də olan folder-ləri qaytarır — auto-cleanup üçün
        /// </summary>
        Task<List<DriveFolder>> GetExpiredDeletedFoldersAsync(int batchSize = 100, CancellationToken cancellationToken = default);
        /// <summary>
        /// Silinmiş folder-in bütün alt folder-lərini tapır (recursive) — restore üçün
        /// </summary>
        Task<List<DriveFolder>> GetAllDeletedDescendantsAsync(Guid folderId, CancellationToken cancellationToken = default);
    }
}

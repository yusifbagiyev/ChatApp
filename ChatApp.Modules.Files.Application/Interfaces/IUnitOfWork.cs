namespace ChatApp.Modules.Files.Application.Interfaces
{
    public interface IUnitOfWork:IDisposable
    {
        IFileRepository Files { get; }
        IDriveFolderRepository DriveFolders { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitTransactionAsync(CancellationToken cancellationToken = default);
        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
        /// <summary>
        /// Raw SQL icra edir — advisory lock və s. üçün
        /// </summary>
        Task ExecuteSqlAsync(string sql, CancellationToken cancellationToken = default);
    }
}
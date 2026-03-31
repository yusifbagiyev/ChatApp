namespace ChatApp.Shared.Kernel.Common;

/// <summary>
/// fileId-dən authenticated serve/avatar URL yaradır.
/// Frontend bu URL-lərdən authenticated fetch + blob URL pattern ilə istifadə edir.
/// </summary>
public static class FileUrlHelper
{
    public static string? ToServeUrl(Guid? fileId)
    {
        if (!fileId.HasValue || fileId == Guid.Empty)
            return null;

        return $"/api/files/serve/{fileId}";
    }

    public static string? ToServeUrl(string? fileId)
    {
        if (string.IsNullOrEmpty(fileId))
            return null;

        return $"/api/files/serve/{fileId}";
    }

    public static string? ToAvatarUrl(Guid? fileId)
    {
        if (!fileId.HasValue || fileId == Guid.Empty)
            return null;

        return $"/api/files/avatar/{fileId}";
    }

    public static string? ToAvatarUrl(string? fileId)
    {
        if (string.IsNullOrEmpty(fileId))
            return null;

        return $"/api/files/avatar/{fileId}";
    }
}

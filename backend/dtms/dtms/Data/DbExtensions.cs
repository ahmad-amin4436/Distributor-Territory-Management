using System.Data;

namespace dtms.Data;

/// <summary>Null-safe readers for <see cref="DataRow"/> columns.</summary>
public static class DbExtensions
{
    public static string GetString(this DataRow row, string column) =>
        row.IsNull(column) ? string.Empty : Convert.ToString(row[column]) ?? string.Empty;

    public static string? GetStringOrNull(this DataRow row, string column) =>
        row.IsNull(column) ? null : Convert.ToString(row[column]);

    public static int GetInt(this DataRow row, string column) =>
        row.IsNull(column) ? 0 : Convert.ToInt32(row[column]);

    public static decimal GetDecimal(this DataRow row, string column) =>
        row.IsNull(column) ? 0m : Convert.ToDecimal(row[column]);

    public static double GetDouble(this DataRow row, string column) =>
        row.IsNull(column) ? 0d : Convert.ToDouble(row[column]);

    /// <summary>Formats a date column as the ISO yyyy-MM-dd the frontend expects.</summary>
    public static string GetIsoDate(this DataRow row, string column) =>
        row.IsNull(column) ? string.Empty
            : Convert.ToDateTime(row[column]).ToString("yyyy-MM-dd");

    /// <summary>Formats a datetime column as a round-trip ISO 8601 string.</summary>
    public static string GetIsoDateTime(this DataRow row, string column) =>
        row.IsNull(column) ? string.Empty
            : Convert.ToDateTime(row[column]).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
}

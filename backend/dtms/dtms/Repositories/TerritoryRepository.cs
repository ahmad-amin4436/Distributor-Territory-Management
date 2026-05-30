using System.Data;
using System.Data.SqlClient;
using dtms.Data;
using dtms.Models;
using Microsoft.Practices.EnterpriseLibrary.Data;

namespace dtms.Repositories;

public interface ITerritoryRepository
{
    List<Territory> GetAll();
    Territory? GetById(string id);
    Territory Insert(Territory territory);
    Territory? Update(Territory territory, bool replaceCoordinates);
    Territory? UpdateCoordinates(string id, List<double[]> coordinates);
    Territory? Assign(string territoryId, string? distributorId);
    bool Delete(string id);
}

/// <summary>
/// ADO.NET data access for territories via the Enterprise Library Data Access
/// Block. Polygon vertices are passed to stored procedures as a table-valued
/// parameter (dbo.CoordinateList).
/// </summary>
public class TerritoryRepository : ITerritoryRepository
{
    private readonly IDatabaseFactory _factory;

    public TerritoryRepository(IDatabaseFactory factory) => _factory = factory;

    public List<Territory> GetAll()
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Territory_GetAll");
        var ds = db.ExecuteDataSet(cmd);

        var territories = new List<Territory>();
        if (ds.Tables.Count == 0) return territories;

        var byId = new Dictionary<string, Territory>();
        foreach (DataRow row in ds.Tables[0].Rows)
        {
            var t = MapTerritory(row);
            territories.Add(t);
            byId[t.Id] = t;
        }

        // Second result set holds the coordinates for every territory.
        if (ds.Tables.Count > 1)
        {
            foreach (DataRow row in ds.Tables[1].Rows)
            {
                var territoryId = row.GetString("TerritoryId");
                if (byId.TryGetValue(territoryId, out var t))
                    t.Coordinates.Add(new[] { row.GetDouble("Lat"), row.GetDouble("Lng") });
            }
        }

        return territories;
    }

    public Territory? GetById(string id)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Territory_GetById");
        db.AddInParameter(cmd, "@Id", DbType.String, id);
        var ds = db.ExecuteDataSet(cmd);
        return MapWithCoordinates(ds);
    }

    public Territory Insert(Territory t)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Territory_Insert");
        db.AddInParameter(cmd, "@Id", DbType.String, t.Id);
        db.AddInParameter(cmd, "@Name", DbType.String, t.Name);
        db.AddInParameter(cmd, "@CoverageArea", DbType.String, (object?)t.CoverageArea ?? DBNull.Value);
        db.AddInParameter(cmd, "@Notes", DbType.String, (object?)t.Notes ?? DBNull.Value);
        db.AddInParameter(cmd, "@Color", DbType.String, (object?)t.Color ?? DBNull.Value);
        db.AddInParameter(cmd, "@DistributorId", DbType.String, (object?)t.DistributorId ?? DBNull.Value);
        db.AddInParameter(cmd, "@CreatedAt", DbType.DateTime2, ParseDateTime(t.CreatedAt));
        db.AddInParameter(cmd, "@MonthlySales", DbType.Decimal, t.MonthlySales);
        db.AddInParameter(cmd, "@TargetSales", DbType.Decimal, t.TargetSales);
        db.AddInParameter(cmd, "@Performance", DbType.String, (object?)t.Performance ?? DBNull.Value);
        db.AddInParameter(cmd, "@Outlets", DbType.Int32, t.Outlets);
        AddCoordinatesParameter(cmd, t.Coordinates);

        var ds = db.ExecuteDataSet(cmd);
        return MapWithCoordinates(ds) ?? t;
    }

    public Territory? Update(Territory t, bool replaceCoordinates)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Territory_Update");
        db.AddInParameter(cmd, "@Id", DbType.String, t.Id);
        db.AddInParameter(cmd, "@Name", DbType.String, t.Name);
        db.AddInParameter(cmd, "@CoverageArea", DbType.String, (object?)t.CoverageArea ?? DBNull.Value);
        db.AddInParameter(cmd, "@Notes", DbType.String, (object?)t.Notes ?? DBNull.Value);
        db.AddInParameter(cmd, "@Color", DbType.String, (object?)t.Color ?? DBNull.Value);
        db.AddInParameter(cmd, "@DistributorId", DbType.String, (object?)t.DistributorId ?? DBNull.Value);
        db.AddInParameter(cmd, "@MonthlySales", DbType.Decimal, t.MonthlySales);
        db.AddInParameter(cmd, "@TargetSales", DbType.Decimal, t.TargetSales);
        db.AddInParameter(cmd, "@Performance", DbType.String, (object?)t.Performance ?? DBNull.Value);
        db.AddInParameter(cmd, "@Outlets", DbType.Int32, t.Outlets);
        AddCoordinatesParameter(cmd, t.Coordinates);
        db.AddInParameter(cmd, "@ReplaceCoordinates", DbType.Boolean, replaceCoordinates);

        var ds = db.ExecuteDataSet(cmd);
        return MapWithCoordinates(ds);
    }

    public Territory? UpdateCoordinates(string id, List<double[]> coordinates)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Territory_UpdateCoordinates");
        db.AddInParameter(cmd, "@Id", DbType.String, id);
        AddCoordinatesParameter(cmd, coordinates);

        var ds = db.ExecuteDataSet(cmd);
        return MapWithCoordinates(ds);
    }

    public Territory? Assign(string territoryId, string? distributorId)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Territory_Assign");
        db.AddInParameter(cmd, "@TerritoryId", DbType.String, territoryId);
        db.AddInParameter(cmd, "@DistributorId", DbType.String, (object?)distributorId ?? DBNull.Value);

        var ds = db.ExecuteDataSet(cmd);
        return MapWithCoordinates(ds);
    }

    public bool Delete(string id)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Territory_Delete");
        db.AddInParameter(cmd, "@Id", DbType.String, id);
        var result = db.ExecuteScalar(cmd);
        return result != null && Convert.ToInt32(result) > 0;
    }

    // --- Helpers ---------------------------------------------------------

    /// <summary>
    /// Attaches the polygon vertices as a structured (table-valued) parameter.
    /// EnterpriseLibrary has no native TVP support, so we add the SqlParameter
    /// to the underlying command directly.
    /// </summary>
    private static void AddCoordinatesParameter(System.Data.Common.DbCommand cmd, List<double[]> coordinates)
    {
        var table = new DataTable();
        table.Columns.Add("PointOrder", typeof(int));
        table.Columns.Add("Lat", typeof(double));
        table.Columns.Add("Lng", typeof(double));

        for (var i = 0; i < coordinates.Count; i++)
        {
            var pt = coordinates[i];
            if (pt.Length < 2) continue;
            table.Rows.Add(i, pt[0], pt[1]);
        }

        var param = new SqlParameter("@Coordinates", SqlDbType.Structured)
        {
            TypeName = "dbo.CoordinateList",
            Value = table,
        };
        cmd.Parameters.Add(param);
    }

    private static object ParseDateTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return DBNull.Value;
        return DateTime.TryParse(value, null,
            System.Globalization.DateTimeStyles.AdjustToUniversal |
            System.Globalization.DateTimeStyles.AssumeUniversal, out var dt)
            ? dt : DBNull.Value;
    }

    private static Territory? MapWithCoordinates(DataSet ds)
    {
        if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0) return null;
        var t = MapTerritory(ds.Tables[0].Rows[0]);
        if (ds.Tables.Count > 1)
            foreach (DataRow row in ds.Tables[1].Rows)
                t.Coordinates.Add(new[] { row.GetDouble("Lat"), row.GetDouble("Lng") });
        return t;
    }

    private static Territory MapTerritory(DataRow row) => new()
    {
        Id = row.GetString("Id"),
        Name = row.GetString("Name"),
        CoverageArea = row.GetString("CoverageArea"),
        Notes = row.GetStringOrNull("Notes"),
        Color = row.GetString("Color"),
        DistributorId = row.GetStringOrNull("DistributorId"),
        CreatedAt = row.GetIsoDateTime("CreatedAt"),
        MonthlySales = row.GetDecimal("MonthlySales"),
        TargetSales = row.GetDecimal("TargetSales"),
        Performance = row.GetString("Performance"),
        Outlets = row.GetInt("Outlets"),
    };
}

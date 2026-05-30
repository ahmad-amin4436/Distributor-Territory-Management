using System.Data;
using System.Data.Common;
using dtms.Data;
using dtms.Models;
using Microsoft.Practices.EnterpriseLibrary.Data;

namespace dtms.Repositories;

public interface IDistributorRepository
{
    List<Distributor> GetAll();
    Distributor? GetById(string id);
    Distributor Insert(Distributor distributor);
    Distributor? Update(Distributor distributor);
    bool Delete(string id);
}

/// <summary>
/// ADO.NET data access for distributors via the Enterprise Library Data
/// Access Block. All commands are stored procedures.
/// </summary>
public class DistributorRepository : IDistributorRepository
{
    private readonly IDatabaseFactory _factory;

    public DistributorRepository(IDatabaseFactory factory) => _factory = factory;

    public List<Distributor> GetAll()
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Distributor_GetAll");
        var ds = db.ExecuteDataSet(cmd);

        var list = new List<Distributor>();
        if (ds.Tables.Count == 0) return list;
        foreach (DataRow row in ds.Tables[0].Rows)
            list.Add(Map(row));
        return list;
    }

    public Distributor? GetById(string id)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Distributor_GetById");
        db.AddInParameter(cmd, "@Id", DbType.String, id);
        var ds = db.ExecuteDataSet(cmd);

        if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0) return null;
        return Map(ds.Tables[0].Rows[0]);
    }

    public Distributor Insert(Distributor d)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Distributor_Insert");
        db.AddInParameter(cmd, "@Id", DbType.String, d.Id);
        db.AddInParameter(cmd, "@Code", DbType.String, d.Code);
        db.AddInParameter(cmd, "@Name", DbType.String, d.Name);
        db.AddInParameter(cmd, "@ContactPerson", DbType.String, (object?)d.ContactPerson ?? DBNull.Value);
        db.AddInParameter(cmd, "@Email", DbType.String, (object?)d.Email ?? DBNull.Value);
        db.AddInParameter(cmd, "@Phone", DbType.String, (object?)d.Phone ?? DBNull.Value);
        db.AddInParameter(cmd, "@Address", DbType.String, (object?)d.Address ?? DBNull.Value);
        db.AddInParameter(cmd, "@City", DbType.String, (object?)d.City ?? DBNull.Value);
        db.AddInParameter(cmd, "@JoinedAt", DbType.Date, ParseDate(d.JoinedAt));
        db.AddInParameter(cmd, "@Status", DbType.String, (object?)d.Status ?? DBNull.Value);
        db.AddInParameter(cmd, "@AvatarColor", DbType.String, (object?)d.AvatarColor ?? DBNull.Value);

        var ds = db.ExecuteDataSet(cmd);
        return ds.Tables[0].Rows.Count > 0 ? Map(ds.Tables[0].Rows[0]) : d;
    }

    public Distributor? Update(Distributor d)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Distributor_Update");
        db.AddInParameter(cmd, "@Id", DbType.String, d.Id);
        db.AddInParameter(cmd, "@Code", DbType.String, (object?)d.Code ?? DBNull.Value);
        db.AddInParameter(cmd, "@Name", DbType.String, d.Name);
        db.AddInParameter(cmd, "@ContactPerson", DbType.String, (object?)d.ContactPerson ?? DBNull.Value);
        db.AddInParameter(cmd, "@Email", DbType.String, (object?)d.Email ?? DBNull.Value);
        db.AddInParameter(cmd, "@Phone", DbType.String, (object?)d.Phone ?? DBNull.Value);
        db.AddInParameter(cmd, "@Address", DbType.String, (object?)d.Address ?? DBNull.Value);
        db.AddInParameter(cmd, "@City", DbType.String, (object?)d.City ?? DBNull.Value);
        db.AddInParameter(cmd, "@JoinedAt", DbType.Date, ParseDate(d.JoinedAt));
        db.AddInParameter(cmd, "@Status", DbType.String, (object?)d.Status ?? DBNull.Value);
        db.AddInParameter(cmd, "@AvatarColor", DbType.String, (object?)d.AvatarColor ?? DBNull.Value);

        var ds = db.ExecuteDataSet(cmd);
        return ds.Tables[0].Rows.Count > 0 ? Map(ds.Tables[0].Rows[0]) : null;
    }

    public bool Delete(string id)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_Distributor_Delete");
        db.AddInParameter(cmd, "@Id", DbType.String, id);
        var result = db.ExecuteScalar(cmd);
        return result != null && Convert.ToInt32(result) > 0;
    }

    private static object ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return DBNull.Value;
        return DateTime.TryParse(value, out var dt) ? dt.Date : DBNull.Value;
    }

    private static Distributor Map(DataRow row) => new()
    {
        Id = row.GetString("Id"),
        Code = row.GetString("Code"),
        Name = row.GetString("Name"),
        ContactPerson = row.GetStringOrNull("ContactPerson"),
        Email = row.GetStringOrNull("Email"),
        Phone = row.GetStringOrNull("Phone"),
        Address = row.GetStringOrNull("Address"),
        City = row.GetStringOrNull("City"),
        JoinedAt = row.GetIsoDate("JoinedAt"),
        Status = row.GetString("Status"),
        AvatarColor = row.GetStringOrNull("AvatarColor"),
        AssignedTerritoryId = row.GetStringOrNull("AssignedTerritoryId"),
    };
}

using System.Data;
using dtms.Data;
using dtms.Models;

namespace dtms.Repositories;

public interface IUserRepository
{
    User? GetByEmail(string email);
    User? GetById(string id);
    User Insert(User user);
    void TouchLogin(string id);
}

/// <summary>ADO.NET data access for users via the Enterprise Library Data Access Block.</summary>
public class UserRepository : IUserRepository
{
    private readonly IDatabaseFactory _factory;

    public UserRepository(IDatabaseFactory factory) => _factory = factory;

    public User? GetByEmail(string email)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_User_GetByEmail");
        db.AddInParameter(cmd, "@Email", DbType.String, email);
        var ds = db.ExecuteDataSet(cmd);
        return ds.Tables[0].Rows.Count > 0 ? Map(ds.Tables[0].Rows[0]) : null;
    }

    public User? GetById(string id)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_User_GetById");
        db.AddInParameter(cmd, "@Id", DbType.String, id);
        var ds = db.ExecuteDataSet(cmd);
        return ds.Tables[0].Rows.Count > 0 ? Map(ds.Tables[0].Rows[0]) : null;
    }

    public User Insert(User u)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_User_Insert");
        db.AddInParameter(cmd, "@Id", DbType.String, u.Id);
        db.AddInParameter(cmd, "@Email", DbType.String, u.Email);
        db.AddInParameter(cmd, "@Name", DbType.String, u.Name);
        db.AddInParameter(cmd, "@Role", DbType.String, (object?)u.Role ?? DBNull.Value);
        db.AddInParameter(cmd, "@PasswordHash", DbType.String, u.PasswordHash);
        db.AddInParameter(cmd, "@PasswordSalt", DbType.String, u.PasswordSalt);
        var ds = db.ExecuteDataSet(cmd);
        return ds.Tables[0].Rows.Count > 0 ? Map(ds.Tables[0].Rows[0]) : u;
    }

    public void TouchLogin(string id)
    {
        var db = _factory.Create();
        using var cmd = db.GetStoredProcCommand("dbo.usp_User_TouchLogin");
        db.AddInParameter(cmd, "@Id", DbType.String, id);
        db.ExecuteNonQuery(cmd);
    }

    private static User Map(DataRow row) => new()
    {
        Id = row.GetString("Id"),
        Email = row.GetString("Email"),
        Name = row.GetString("Name"),
        Role = row.GetString("Role"),
        PasswordHash = row.GetString("PasswordHash"),
        PasswordSalt = row.GetString("PasswordSalt"),
    };
}

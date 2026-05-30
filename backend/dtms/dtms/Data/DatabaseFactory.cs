using Microsoft.Practices.EnterpriseLibrary.Data;
using Microsoft.Practices.EnterpriseLibrary.Data.Sql;

namespace dtms.Data;

/// <summary>
/// Builds the Enterprise Library <see cref="Database"/> used by the
/// repositories. We construct a <see cref="SqlDatabase"/> directly from the
/// configured connection string (the classic DatabaseFactory config section is
/// not required on .NET Core).
/// </summary>
public interface IDatabaseFactory
{
    Database Create();
}

public class SqlServerDatabaseFactory : IDatabaseFactory
{
    private readonly string _connectionString;

    public SqlServerDatabaseFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DtmsDb")
            ?? throw new InvalidOperationException(
                "Connection string 'DtmsDb' is not configured.");
    }

    public Database Create() => new SqlDatabase(_connectionString);
}

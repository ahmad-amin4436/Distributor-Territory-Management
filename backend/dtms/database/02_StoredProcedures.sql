/* =====================================================================
   DTMS  --  Stored procedures
   Called from the ADO.NET data-access layer (Enterprise Library).
   ===================================================================== */

USE DTMS;
GO

-- Procedures touch tables with a filtered index, so they must be created
-- (and will execute) with QUOTED_IDENTIFIER ON. Run this script with
-- sqlcmd -I, or keep this SET so the stored definitions capture it.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ---------- Table type for passing polygon coordinates ---------- */
IF TYPE_ID('dbo.CoordinateList') IS NULL
BEGIN
    CREATE TYPE dbo.CoordinateList AS TABLE
    (
        PointOrder INT   NOT NULL,
        Lat        FLOAT NOT NULL,
        Lng        FLOAT NOT NULL
    );
END
GO

/* =====================================================================
   DISTRIBUTORS
   ===================================================================== */

CREATE OR ALTER PROCEDURE dbo.usp_Distributor_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  d.Id, d.Code, d.Name, d.ContactPerson, d.Email, d.Phone,
            d.Address, d.City, d.JoinedAt, d.Status, d.AvatarColor,
            AssignedTerritoryId = t.Id
    FROM    dbo.Distributors d
    LEFT JOIN dbo.Territories t ON t.DistributorId = d.Id
    ORDER BY d.CreatedAt;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Distributor_GetById
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  d.Id, d.Code, d.Name, d.ContactPerson, d.Email, d.Phone,
            d.Address, d.City, d.JoinedAt, d.Status, d.AvatarColor,
            AssignedTerritoryId = t.Id
    FROM    dbo.Distributors d
    LEFT JOIN dbo.Territories t ON t.DistributorId = d.Id
    WHERE   d.Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Distributor_Insert
    @Id            NVARCHAR(50),
    @Code          NVARCHAR(50),
    @Name          NVARCHAR(200),
    @ContactPerson NVARCHAR(200),
    @Email         NVARCHAR(200),
    @Phone         NVARCHAR(50),
    @Address       NVARCHAR(400),
    @City          NVARCHAR(120),
    @JoinedAt      DATE,
    @Status        NVARCHAR(20),
    @AvatarColor   NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Distributors
        (Id, Code, Name, ContactPerson, Email, Phone, Address, City, JoinedAt, Status, AvatarColor)
    VALUES
        (@Id, @Code, @Name, @ContactPerson, @Email, @Phone, @Address, @City,
         ISNULL(@JoinedAt, CAST(GETDATE() AS DATE)),
         ISNULL(@Status, 'active'), @AvatarColor);

    EXEC dbo.usp_Distributor_GetById @Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Distributor_Update
    @Id            NVARCHAR(50),
    @Code          NVARCHAR(50),
    @Name          NVARCHAR(200),
    @ContactPerson NVARCHAR(200),
    @Email         NVARCHAR(200),
    @Phone         NVARCHAR(50),
    @Address       NVARCHAR(400),
    @City          NVARCHAR(120),
    @JoinedAt      DATE,
    @Status        NVARCHAR(20),
    @AvatarColor   NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Distributors
    SET    Code          = @Code,
           Name          = @Name,
           ContactPerson = @ContactPerson,
           Email         = @Email,
           Phone         = @Phone,
           Address       = @Address,
           City          = @City,
           JoinedAt      = ISNULL(@JoinedAt, JoinedAt),
           Status        = ISNULL(@Status, Status),
           AvatarColor   = @AvatarColor,
           UpdatedAt     = SYSUTCDATETIME()
    WHERE  Id = @Id;

    EXEC dbo.usp_Distributor_GetById @Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Distributor_Delete
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- Unassign any territory pointing at this distributor first.
    UPDATE dbo.Territories SET DistributorId = NULL WHERE DistributorId = @Id;
    DELETE FROM dbo.Distributors WHERE Id = @Id;
    SELECT @@ROWCOUNT AS Affected;
END
GO

/* =====================================================================
   TERRITORIES
   ===================================================================== */

CREATE OR ALTER PROCEDURE dbo.usp_Territory_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  Id, Name, CoverageArea, Notes, Color, DistributorId, CreatedAt,
            MonthlySales, TargetSales, Performance, Outlets, Population
    FROM    dbo.Territories
    ORDER BY CreatedAt;

    SELECT  TerritoryId, PointOrder, Lat, Lng
    FROM    dbo.TerritoryCoordinates
    ORDER BY TerritoryId, PointOrder;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Territory_GetById
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  Id, Name, CoverageArea, Notes, Color, DistributorId, CreatedAt,
            MonthlySales, TargetSales, Performance, Outlets, Population
    FROM    dbo.Territories
    WHERE   Id = @Id;

    SELECT  TerritoryId, PointOrder, Lat, Lng
    FROM    dbo.TerritoryCoordinates
    WHERE   TerritoryId = @Id
    ORDER BY PointOrder;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Territory_Insert
    @Id            NVARCHAR(50),
    @Name          NVARCHAR(200),
    @CoverageArea  NVARCHAR(400),
    @Notes         NVARCHAR(MAX),
    @Color         NVARCHAR(20),
    @DistributorId NVARCHAR(50),
    @CreatedAt     DATETIME2(0),
    @MonthlySales  DECIMAL(18,2),
    @TargetSales   DECIMAL(18,2),
    @Performance   NVARCHAR(20),
    @Outlets       INT,
    @Population    INT,
    @Coordinates   dbo.CoordinateList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRAN;

    -- Enforce one-territory-per-distributor by clearing prior assignment.
    IF @DistributorId IS NOT NULL
        UPDATE dbo.Territories SET DistributorId = NULL WHERE DistributorId = @DistributorId;

    INSERT INTO dbo.Territories
        (Id, Name, CoverageArea, Notes, Color, DistributorId, CreatedAt,
         MonthlySales, TargetSales, Performance, Outlets, Population)
    VALUES
        (@Id, @Name, @CoverageArea, @Notes, ISNULL(@Color, '#6366f1'), @DistributorId,
         ISNULL(@CreatedAt, SYSUTCDATETIME()),
         ISNULL(@MonthlySales, 0), ISNULL(@TargetSales, 0),
         ISNULL(@Performance, 'average'), ISNULL(@Outlets, 0), ISNULL(@Population, 0));

    INSERT INTO dbo.TerritoryCoordinates (TerritoryId, PointOrder, Lat, Lng)
    SELECT @Id, PointOrder, Lat, Lng FROM @Coordinates;

    COMMIT;

    EXEC dbo.usp_Territory_GetById @Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Territory_Update
    @Id            NVARCHAR(50),
    @Name          NVARCHAR(200),
    @CoverageArea  NVARCHAR(400),
    @Notes         NVARCHAR(MAX),
    @Color         NVARCHAR(20),
    @DistributorId NVARCHAR(50),
    @MonthlySales  DECIMAL(18,2),
    @TargetSales   DECIMAL(18,2),
    @Performance   NVARCHAR(20),
    @Outlets       INT,
    @Population    INT,
    @Coordinates   dbo.CoordinateList READONLY,
    @ReplaceCoordinates BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRAN;

    IF @DistributorId IS NOT NULL
        UPDATE dbo.Territories SET DistributorId = NULL
        WHERE DistributorId = @DistributorId AND Id <> @Id;

    UPDATE dbo.Territories
    SET    Name          = @Name,
           CoverageArea  = @CoverageArea,
           Notes         = @Notes,
           Color         = ISNULL(@Color, Color),
           DistributorId = @DistributorId,
           MonthlySales  = ISNULL(@MonthlySales, MonthlySales),
           TargetSales   = ISNULL(@TargetSales, TargetSales),
           Performance   = ISNULL(@Performance, Performance),
           Outlets       = ISNULL(@Outlets, Outlets),
           Population     = ISNULL(@Population, Population),
           UpdatedAt     = SYSUTCDATETIME()
    WHERE  Id = @Id;

    -- Only replace polygon vertices when a new set was supplied.
    IF @ReplaceCoordinates = 1 AND EXISTS (SELECT 1 FROM @Coordinates)
    BEGIN
        DELETE FROM dbo.TerritoryCoordinates WHERE TerritoryId = @Id;
        INSERT INTO dbo.TerritoryCoordinates (TerritoryId, PointOrder, Lat, Lng)
        SELECT @Id, PointOrder, Lat, Lng FROM @Coordinates;
    END

    COMMIT;

    EXEC dbo.usp_Territory_GetById @Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Territory_UpdateCoordinates
    @Id          NVARCHAR(50),
    @Coordinates dbo.CoordinateList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRAN;
        DELETE FROM dbo.TerritoryCoordinates WHERE TerritoryId = @Id;
        INSERT INTO dbo.TerritoryCoordinates (TerritoryId, PointOrder, Lat, Lng)
        SELECT @Id, PointOrder, Lat, Lng FROM @Coordinates;
        UPDATE dbo.Territories SET UpdatedAt = SYSUTCDATETIME() WHERE Id = @Id;
    COMMIT;

    EXEC dbo.usp_Territory_GetById @Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Territory_Assign
    @TerritoryId   NVARCHAR(50),
    @DistributorId NVARCHAR(50)   -- NULL clears the assignment
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRAN;
        IF @DistributorId IS NOT NULL
            UPDATE dbo.Territories SET DistributorId = NULL
            WHERE DistributorId = @DistributorId AND Id <> @TerritoryId;

        UPDATE dbo.Territories
        SET DistributorId = @DistributorId, UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @TerritoryId;
    COMMIT;

    EXEC dbo.usp_Territory_GetById @Id = @TerritoryId;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_Territory_Delete
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Territories WHERE Id = @Id;   -- coordinates cascade
    SELECT @@ROWCOUNT AS Affected;
END
GO

PRINT 'DTMS stored procedures ready.';
GO

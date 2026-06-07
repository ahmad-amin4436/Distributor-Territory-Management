/* =====================================================================
   DTMS  --  Migration: add Territories.Population
   Idempotent. Adds the user-entered population figure to territories and
   refreshes the affected stored procedures.
   ===================================================================== */

USE DTMS;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF COL_LENGTH('dbo.Territories', 'Population') IS NULL
BEGIN
    ALTER TABLE dbo.Territories
        ADD Population INT NOT NULL CONSTRAINT DF_Territories_Population DEFAULT (0);
END
GO

/* ---------- Refresh procedures to include Population ---------- */

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

PRINT 'DTMS Population migration applied.';
GO

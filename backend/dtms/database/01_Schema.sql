/* =====================================================================
   Distributor Territory Management System (DTMS)
   Database schema  --  SQL Server 2022
   ---------------------------------------------------------------------
   Models the data structures used by the Next.js frontend:
     - Distributor   (mock/distributors.ts / types/index.ts)
     - Territory     (mock/territories.ts / types/index.ts)
     - Territory polygon coordinates (LatLng[])
   ===================================================================== */

IF DB_ID('DTMS') IS NULL
BEGIN
    CREATE DATABASE DTMS;
END
GO

USE DTMS;
GO

-- Required for filtered indexes (sqlcmd defaults QUOTED_IDENTIFIER OFF).
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ---------------------------------------------------------------------
   Distributors
   --------------------------------------------------------------------- */
IF OBJECT_ID('dbo.Distributors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Distributors
    (
        Id              NVARCHAR(50)   NOT NULL CONSTRAINT PK_Distributors PRIMARY KEY,
        Code            NVARCHAR(50)   NOT NULL,
        Name            NVARCHAR(200)  NOT NULL,
        ContactPerson   NVARCHAR(200)  NULL,
        Email           NVARCHAR(200)  NULL,
        Phone           NVARCHAR(50)   NULL,
        Address         NVARCHAR(400)  NULL,
        City            NVARCHAR(120)  NULL,
        JoinedAt        DATE           NOT NULL CONSTRAINT DF_Distributors_JoinedAt DEFAULT (CAST(GETDATE() AS DATE)),
        Status          NVARCHAR(20)   NOT NULL CONSTRAINT DF_Distributors_Status DEFAULT ('active'),
        AvatarColor     NVARCHAR(20)   NULL,
        CreatedAt       DATETIME2(0)   NOT NULL CONSTRAINT DF_Distributors_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(0)   NOT NULL CONSTRAINT DF_Distributors_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_Distributors_Status CHECK (Status IN ('active','inactive','pending'))
    );

    CREATE UNIQUE INDEX UX_Distributors_Code ON dbo.Distributors(Code);
END
GO

/* ---------------------------------------------------------------------
   Territories
     - DistributorId is the single source of truth for assignment.
       The frontend's distributor.assignedTerritoryId is derived from it.
   --------------------------------------------------------------------- */
IF OBJECT_ID('dbo.Territories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Territories
    (
        Id              NVARCHAR(50)   NOT NULL CONSTRAINT PK_Territories PRIMARY KEY,
        Name            NVARCHAR(200)  NOT NULL,
        CoverageArea    NVARCHAR(400)  NULL,
        Notes           NVARCHAR(MAX)  NULL,
        Color           NVARCHAR(20)   NOT NULL CONSTRAINT DF_Territories_Color DEFAULT ('#6366f1'),
        DistributorId   NVARCHAR(50)   NULL,
        CreatedAt       DATETIME2(0)   NOT NULL CONSTRAINT DF_Territories_CreatedAt DEFAULT (SYSUTCDATETIME()),
        MonthlySales    DECIMAL(18,2)  NOT NULL CONSTRAINT DF_Territories_MonthlySales DEFAULT (0),
        TargetSales     DECIMAL(18,2)  NOT NULL CONSTRAINT DF_Territories_TargetSales DEFAULT (0),
        Performance     NVARCHAR(20)   NOT NULL CONSTRAINT DF_Territories_Performance DEFAULT ('average'),
        Outlets         INT            NOT NULL CONSTRAINT DF_Territories_Outlets DEFAULT (0),
        UpdatedAt       DATETIME2(0)   NOT NULL CONSTRAINT DF_Territories_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_Territories_Performance
            CHECK (Performance IN ('excellent','good','average','underperforming')),
        CONSTRAINT FK_Territories_Distributor
            FOREIGN KEY (DistributorId) REFERENCES dbo.Distributors(Id)
    );

    -- A distributor can be assigned to at most one territory.
    CREATE UNIQUE INDEX UX_Territories_DistributorId
        ON dbo.Territories(DistributorId)
        WHERE DistributorId IS NOT NULL;
END
GO

/* ---------------------------------------------------------------------
   TerritoryCoordinates  (ordered polygon vertices, LatLng[])
   --------------------------------------------------------------------- */
IF OBJECT_ID('dbo.TerritoryCoordinates', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TerritoryCoordinates
    (
        Id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TerritoryCoordinates PRIMARY KEY,
        TerritoryId     NVARCHAR(50)   NOT NULL,
        PointOrder      INT            NOT NULL,
        Lat             FLOAT          NOT NULL,
        Lng             FLOAT          NOT NULL,
        CONSTRAINT FK_TerritoryCoordinates_Territory
            FOREIGN KEY (TerritoryId) REFERENCES dbo.Territories(Id) ON DELETE CASCADE
    );

    CREATE INDEX IX_TerritoryCoordinates_TerritoryId
        ON dbo.TerritoryCoordinates(TerritoryId, PointOrder);
END
GO

PRINT 'DTMS schema ready.';
GO

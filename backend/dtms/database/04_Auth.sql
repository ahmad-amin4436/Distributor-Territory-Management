/* =====================================================================
   DTMS  --  Authentication
   Users table + stored procedures (PBKDF2 hashing is done in the API;
   the DB stores PasswordHash + PasswordSalt only).
   ===================================================================== */

USE DTMS;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        Id            NVARCHAR(50)   NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        Email         NVARCHAR(200)  NOT NULL,
        Name          NVARCHAR(200)  NOT NULL,
        Role          NVARCHAR(80)   NOT NULL CONSTRAINT DF_Users_Role DEFAULT ('Territory Admin'),
        PasswordHash  NVARCHAR(256)  NOT NULL,
        PasswordSalt  NVARCHAR(256)  NOT NULL,
        CreatedAt     DATETIME2(0)   NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
        LastLoginAt   DATETIME2(0)   NULL
    );

    CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email);
END
GO

/* ---------------------------------------------------------------------
   Procedures
   --------------------------------------------------------------------- */

CREATE OR ALTER PROCEDURE dbo.usp_User_GetByEmail
    @Email NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Email, Name, Role, PasswordHash, PasswordSalt, CreatedAt, LastLoginAt
    FROM   dbo.Users
    WHERE  Email = @Email;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_User_GetById
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Email, Name, Role, PasswordHash, PasswordSalt, CreatedAt, LastLoginAt
    FROM   dbo.Users
    WHERE  Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_User_Insert
    @Id           NVARCHAR(50),
    @Email        NVARCHAR(200),
    @Name         NVARCHAR(200),
    @Role         NVARCHAR(80),
    @PasswordHash NVARCHAR(256),
    @PasswordSalt NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Users (Id, Email, Name, Role, PasswordHash, PasswordSalt)
    VALUES (@Id, @Email, @Name, ISNULL(@Role, 'Territory Admin'), @PasswordHash, @PasswordSalt);

    EXEC dbo.usp_User_GetById @Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_User_TouchLogin
    @Id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users SET LastLoginAt = SYSUTCDATETIME() WHERE Id = @Id;
END
GO

PRINT 'DTMS auth objects ready.';
GO

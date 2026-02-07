-- Simplified migration: Database already has no old User columns
-- Just create new tables and migrate existing data

PRINT 'Starting simplified migration...';
GO

-- Create Roles table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE [Roles] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(50) NOT NULL,
        [Description] nvarchar(255) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_Roles_Name] ON [Roles] ([Name]);
    
    SET IDENTITY_INSERT [Roles] ON;
    INSERT INTO [Roles] ([Id], [Name], [Description], [CreatedAt])
    VALUES 
        (1, 'User', 'Standard user access', GETUTCDATE()),
        (2, 'Admin', 'Administrator with full access', GETUTCDATE());
    SET IDENTITY_INSERT [Roles] OFF;
    PRINT 'Roles table created';
END

-- Create MemberProfiles table  
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MemberProfiles')
BEGIN
    CREATE TABLE [MemberProfiles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [MembershipNumber] nvarchar(20) NOT NULL,
        [MembershipStatus] int NOT NULL,
        [MemberSince] datetime2 NULL,
        [PaymentPreference] nvarchar(20) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_MemberProfiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MemberProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_MemberProfiles_UserId] ON [MemberProfiles] ([UserId]);
    CREATE UNIQUE INDEX [IX_MemberProfiles_MembershipNumber] ON [MemberProfiles] ([MembershipNumber]);
    
    -- Create MemberProfiles for all existing users
    INSERT INTO [MemberProfiles] ([UserId], [MembershipNumber], [MembershipStatus], [MemberSince], [CreatedAt])
    SELECT 
        u.[Id],
        'CDP-' + RIGHT('000000' + CAST(ROW_NUMBER() OVER (ORDER BY u.[Id]) AS VARCHAR), 6),
        0,
        u.[CreatedAt],
        GETUTCDATE()
    FROM [Users] u;
    
    PRINT 'MemberProfiles table created with ' + CAST(@@ROWCOUNT AS VARCHAR) + ' records';
END

-- Create UserRoles table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE [UserRoles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [RoleId] int NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
    CREATE UNIQUE INDEX [IX_UserRoles_UserId_RoleId] ON [UserRoles] ([UserId], [RoleId]);
    
    -- Assign all existing users the User role (Id=1)
    INSERT INTO [UserRoles] ([UserId], [RoleId], [AssignedAt])
    SELECT u.[Id], 1, GETUTCDATE()
    FROM [Users] u;
    
    -- Admin user gets Admin role (check if user Id=1 exists)
    IF EXISTS (SELECT 1 FROM [Users] WHERE Id = 1)
    BEGIN
        UPDATE [UserRoles] SET [RoleId] = 2 WHERE [UserId] = 1;
        PRINT 'UserRoles table created with ' + CAST(@@ROWCOUNT AS VARCHAR) + ' records';
    END
END

-- Create AthleteProfiles table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AthleteProfiles')
BEGIN
    CREATE TABLE [AthleteProfiles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Height] int NULL,
        [Weight] int NULL,
        [MedicalCertificateExpiry] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AthleteProfiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AthleteProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_AthleteProfiles_UserId] ON [AthleteProfiles] ([UserId]);
    PRINT 'AthleteProfiles table created';
END

-- Create Teams table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Teams')
BEGIN
    CREATE TABLE [Teams] (
        [Id] int NOT NULL IDENTITY,
        [SportId] int NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Category] nvarchar(50) NULL,
        [Gender] int NOT NULL,
        [Season] nvarchar(20) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Teams] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Teams_Sports_SportId] FOREIGN KEY ([SportId]) REFERENCES [Sports] ([Id]) ON DELETE NO ACTION
    );
    CREATE INDEX [IX_Teams_SportId] ON [Teams] ([SportId]);
    PRINT 'Teams table created';
END

-- Create CoachProfiles table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CoachProfiles')
BEGIN
    CREATE TABLE [CoachProfiles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [SportId] int NOT NULL,
        [TeamId] int NULL,
        [LicenseNumber] nvarchar(50) NULL,
        [LicenseLevel] nvarchar(20) NULL,
        [LicenseExpiry] datetime2 NULL,
        [Specialization] nvarchar(100) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CoachProfiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CoachProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CoachProfiles_Sports_SportId] FOREIGN KEY ([SportId]) REFERENCES [Sports] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_CoachProfiles_Teams_TeamId] FOREIGN KEY ([TeamId]) REFERENCES [Teams] ([Id]) ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX [IX_CoachProfiles_UserId] ON [CoachProfiles] ([UserId]);
    CREATE INDEX [IX_CoachProfiles_SportId] ON [CoachProfiles] ([SportId]);
    CREATE INDEX [IX_CoachProfiles_TeamId] ON [CoachProfiles] ([TeamId]);
    PRINT 'CoachProfiles table created';
END

-- Create AthleteTeams table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AthleteTeams')
BEGIN
    CREATE TABLE [AthleteTeams] (
        [Id] int NOT NULL IDENTITY,
        [AthleteProfileId] int NOT NULL,
        [TeamId] int NOT NULL,
        [JerseyNumber] int NULL,
        [Position] nvarchar(50) NULL,
        [LicenseNumber] nvarchar(50) NULL,
        [IsCaptain] bit NOT NULL,
        [JoinedAt] datetime2 NOT NULL,
        [LeftAt] datetime2 NULL,
        CONSTRAINT [PK_AthleteTeams] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AthleteTeams_AthleteProfiles_AthleteProfileId] FOREIGN KEY ([AthleteProfileId]) REFERENCES [AthleteProfiles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AthleteTeams_Teams_TeamId] FOREIGN KEY ([TeamId]) REFERENCES [Teams] ([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_AthleteTeams_AthleteProfileId_TeamId] ON [AthleteTeams] ([AthleteProfileId], [TeamId]);
    CREATE INDEX [IX_AthleteTeams_TeamId] ON [AthleteTeams] ([TeamId]);
    PRINT 'AthleteTeams table created';
END

-- Migrate Payments if needed
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'UserId')
BEGIN
    PRINT 'Migrating Payments to MemberProfileId...';
    
    ALTER TABLE [Payments] DROP CONSTRAINT [FK_Payments_Users_UserId];
    ALTER TABLE [Payments] ADD MemberProfileId_New int NULL;
    
    UPDATE p
    SET p.MemberProfileId_New = mp.Id
    FROM [Payments] p
    INNER JOIN [MemberProfiles] mp ON p.UserId = mp.UserId;
    
    DROP INDEX [IX_Payments_UserId] ON [Payments];
    ALTER TABLE [Payments] DROP COLUMN [UserId];
    EXEC sp_rename 'Payments.MemberProfileId_New', 'MemberProfileId', 'COLUMN';
    ALTER TABLE [Payments] ALTER COLUMN [MemberProfileId] int NOT NULL;
    
    ALTER TABLE [Payments] ADD CONSTRAINT [FK_Payments_MemberProfiles_MemberProfileId] 
        FOREIGN KEY ([MemberProfileId]) REFERENCES [MemberProfiles] ([Id]) ON DELETE CASCADE;
    CREATE INDEX [IX_Payments_MemberProfileId] ON [Payments] ([MemberProfileId]);
    
    PRINT 'Payments migrated successfully';
END

PRINT '=========================================';
PRINT '   Migration completed successfully!';
PRINT '=========================================';
GO

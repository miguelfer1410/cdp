-- =====================================================
-- CDP Database Migration Script
-- Migrates from single User table to flexible Roles + Profiles system
-- =====================================================

BEGIN TRANSACTION;

PRINT 'Starting database migration...';

-- Step 1: Create new tables (Roles, UserRoles, MemberProfiles, etc.)
PRINT 'Step 1: Creating new tables...';

-- Create Roles table
CREATE TABLE [Roles] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(50) NOT NULL,
    [Description] nvarchar(255) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);

CREATE UNIQUE INDEX [IX_Roles_Name] ON [Roles] ([Name]);

-- Create MemberProfiles table
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

-- Create UserRoles table
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

-- Create AthleteProfiles table
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

-- Create Teams table
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

-- Create CoachProfiles table
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

-- Create AthleteTeams table
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

PRINT 'Step 1 complete: Tables created';

-- Step 2: Seed Roles
PRINT 'Step 2: Seeding Roles...';

SET IDENTITY_INSERT [Roles] ON;
INSERT INTO [Roles] ([Id], [Name], [Description], [CreatedAt])
VALUES 
    (1, 'User', 'Standard user access', GETUTCDATE()),
    (2, 'Admin', 'Administrator with full access', GETUTCDATE());
SET IDENTITY_INSERT [Roles] OFF;

PRINT 'Step 2 complete: Roles seeded';

-- Step 3: Migrate existing Users to new structure
PRINT 'Step 3: Migrating existing users...';

-- Create MemberProfiles for all users with UserType = Socio, Atleta, or Treinador (1, 2, 3)
DECLARE @counter INT = 1;

INSERT INTO [MemberProfiles] ([UserId], [MembershipNumber], [MembershipStatus], [MemberSince], [CreatedAt])
SELECT 
    u.[Id],
    'CDP-' + RIGHT('000000' + CAST(ROW_NUMBER() OVER (ORDER BY u.[Id]) AS VARCHAR), 6),
    u.[MembershipStatus],
    u.[MemberSince],
    GETUTCDATE()
FROM [Users] u
WHERE u.[UserType] IN (1, 2, 3); -- Socio, Atleta, Treinador

PRINT 'MemberProfiles created: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Create UserRoles based on old Role field
INSERT INTO [UserRoles] ([UserId], [RoleId], [AssignedAt])
SELECT 
    u.[Id],
    CASE 
        WHEN u.[Role] = 'Admin' THEN 2
        ELSE 1
    END,
    GETUTCDATE()
FROM [Users] u
WHERE u.[Id] > 1; -- Skip admin user already seeded

PRINT 'UserRoles created: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Update admin user (Id = 1) that was already seeded
IF NOT EXISTS (SELECT 1 FROM [UserRoles] WHERE [UserId] = 1)
BEGIN
    INSERT INTO [UserRoles] ([UserId], [RoleId], [AssignedAt])
    VALUES (1, 2, GETUTCDATE());
    PRINT 'Admin UserRole created';
END

-- Create AthleteProfiles for users with UserType = Atleta (2)
INSERT INTO [AthleteProfiles] ([UserId], [CreatedAt])
SELECT 
    u.[Id],
    GETUTCDATE()
FROM [Users] u
WHERE u.[UserType] = 2; -- Atleta

PRINT 'AthleteProfiles created: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Create CoachProfiles for users with UserType = Treinador (3)
-- Note: This requires a default SportId. If you don't have Sports, skip this or assign later
-- Commenting out for now - needs to be handled based on actual Sport data
-- INSERT INTO [CoachProfiles] ([UserId], [SportId], [CreatedAt])
-- SELECT u.[Id], 1, GETUTCDATE()  -- Assuming SportId = 1 exists
-- FROM [Users] u
-- WHERE u.[UserType] = 3; -- Treinador

PRINT 'Step 3 complete: User migration done';

-- Step 4: Migrate Payments to reference MemberProfiles
PRINT 'Step 4: Migrating Payments...';

-- First, drop the old FK constraint
ALTER TABLE [Payments] DROP CONSTRAINT [FK_Payments_Users_UserId];

-- Add temporary column for MemberProfileId
ALTER TABLE [Payments] ADD [MemberProfileId_New] int NULL;

-- Update MemberProfileId_New with the correct MemberProfile.Id based on UserId
UPDATE p
SET p.[MemberProfileId_New] = mp.[Id]
FROM [Payments] p
INNER JOIN [MemberProfiles] mp ON p.[UserId] = mp.[UserId];

PRINT 'Payments updated with MemberProfileId: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Drop the index on UserId before dropping the column`r`nDROP INDEX [IX_Payments_UserId] ON [Payments];`r`n`r`n-- Drop old UserId column`r`nALTER TABLE [Payments] DROP COLUMN [UserId];

-- Rename new column to MemberProfileId
EXEC sp_rename 'Payments.MemberProfileId_New', 'MemberProfileId', 'COLUMN';

-- Make it NOT NULL
ALTER TABLE [Payments] ALTER COLUMN [MemberProfileId] int NOT NULL;

-- Add new FK constraint
ALTER TABLE [Payments] ADD CONSTRAINT [FK_Payments_MemberProfiles_MemberProfileId] 
    FOREIGN KEY ([MemberProfileId]) REFERENCES [MemberProfiles] ([Id]) ON DELETE CASCADE;

-- Create index
CREATE INDEX [IX_Payments_MemberProfileId] ON [Payments] ([MemberProfileId]);

PRINT 'Step 4 complete: Payments migrated';

-- Step 5: Remove old columns from Users table
PRINT 'Step 5: Cleaning up Users table...';

ALTER TABLE [Users] DROP COLUMN [UserType];
ALTER TABLE [Users] DROP COLUMN [Role];
ALTER TABLE [Users] DROP COLUMN [MembershipStatus];
ALTER TABLE [Users] DROP COLUMN [MemberSince];

PRINT 'Step 5 complete: Old columns removed';

PRINT 'Migration completed successfully!';

COMMIT TRANSACTION;

PRINT '=========================================';
PRINT 'Database migration finished';
PRINT '=========================================';

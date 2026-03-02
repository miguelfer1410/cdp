IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Email] nvarchar(255) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [FirstName] nvarchar(100) NOT NULL,
    [LastName] nvarchar(100) NOT NULL,
    [UserType] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [LastLogin] datetime2 NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO

IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'Email', N'FirstName', N'IsActive', N'LastLogin', N'LastName', N'PasswordHash', N'UserType') AND [object_id] = OBJECT_ID(N'[Users]'))
    SET IDENTITY_INSERT [Users] ON;
INSERT INTO [Users] ([Id], [CreatedAt], [Email], [FirstName], [IsActive], [LastLogin], [LastName], [PasswordHash], [UserType])
VALUES (1, '2026-01-28T14:36:43.2185232Z', N'admin@cdp.com', N'Admin', CAST(1 AS bit), NULL, N'User', N'$2a$11$6fh46OG14o7yedhUIHS5u.X2ExeybpAtgUclcgmyPjSQBe.eunIda', 4);
IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'Email', N'FirstName', N'IsActive', N'LastLogin', N'LastName', N'PasswordHash', N'UserType') AND [object_id] = OBJECT_ID(N'[Users]'))
    SET IDENTITY_INSERT [Users] OFF;
GO

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260128143643_InitialCreate', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Users] ADD [Address] nvarchar(255) NULL;
GO

ALTER TABLE [Users] ADD [BirthDate] datetime2 NULL;
GO

ALTER TABLE [Users] ADD [City] nvarchar(100) NULL;
GO

ALTER TABLE [Users] ADD [Nif] nvarchar(9) NULL;
GO

ALTER TABLE [Users] ADD [Phone] nvarchar(20) NULL;
GO

ALTER TABLE [Users] ADD [PostalCode] nvarchar(10) NULL;
GO

UPDATE [Users] SET [Address] = NULL, [BirthDate] = NULL, [City] = NULL, [CreatedAt] = '2026-02-02T09:32:28.9208964Z', [Nif] = NULL, [PasswordHash] = N'$2a$11$HegCNxIkAF4FcJx5qrL5d.A9tdk7DDdA4UxR7slTsPNnthmbnpMqC', [Phone] = NULL, [PostalCode] = NULL
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260202093229_AddUserProfileFields', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Users] ADD [MemberSince] datetime2 NULL;
GO

ALTER TABLE [Users] ADD [MembershipStatus] int NOT NULL DEFAULT 0;
GO

CREATE TABLE [Payments] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PaymentDate] datetime2 NOT NULL,
    [PaymentMethod] nvarchar(50) NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [Description] nvarchar(255) NULL,
    [TransactionId] nvarchar(100) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Payments_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

UPDATE [Users] SET [CreatedAt] = '2026-02-04T09:14:21.3251003Z', [MemberSince] = '2026-02-04T09:14:21.3250993Z', [MembershipStatus] = 1, [PasswordHash] = N'$2a$11$JtMy8Gi/3bO.AVnF1c6aYuxdytTuzEKbYJ.4ngAluKOE66X7OFowa'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_Payments_UserId] ON [Payments] ([UserId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260204091421_AddMembershipStatusAndPayments', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Users] ADD [Role] nvarchar(20) NOT NULL DEFAULT N'User';
GO

CREATE TABLE [HeroBanners] (
    [Id] int NOT NULL IDENTITY,
    [ImageUrl] nvarchar(500) NOT NULL,
    [Title] nvarchar(200) NULL,
    [Subtitle] nvarchar(500) NULL,
    [ButtonText] nvarchar(100) NULL,
    [ButtonLink] nvarchar(500) NULL,
    [Order] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_HeroBanners] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [InstitutionalPartners] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(200) NOT NULL,
    [LogoUrl] nvarchar(500) NOT NULL,
    [WebsiteUrl] nvarchar(500) NULL,
    [Description] nvarchar(1000) NULL,
    [Order] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_InstitutionalPartners] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [NewsArticles] (
    [Id] int NOT NULL IDENTITY,
    [Title] nvarchar(200) NOT NULL,
    [Slug] nvarchar(250) NOT NULL,
    [Excerpt] nvarchar(500) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [ImageUrl] nvarchar(500) NULL,
    [Category] nvarchar(50) NOT NULL,
    [AuthorId] int NOT NULL,
    [PublishedAt] datetime2 NULL,
    [IsPublished] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_NewsArticles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_NewsArticles_Users_AuthorId] FOREIGN KEY ([AuthorId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Sports] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [ImageUrl] nvarchar(500) NULL,
    [Schedule] nvarchar(max) NULL,
    [ContactInfo] nvarchar(500) NULL,
    [IsActive] bit NOT NULL,
    [Order] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Sports] PRIMARY KEY ([Id])
);
GO

UPDATE [Users] SET [CreatedAt] = '2026-02-04T11:20:55.7362856Z', [MemberSince] = '2026-02-04T11:20:55.7362851Z', [PasswordHash] = N'$2a$11$Xmm7cvZz6aeZs85GbJNazu3XjAlWPz45l83i9HI6JI7BtsFPeLRCW', [Role] = N'Admin'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_NewsArticles_AuthorId] ON [NewsArticles] ([AuthorId]);
GO

CREATE UNIQUE INDEX [IX_NewsArticles_Slug] ON [NewsArticles] ([Slug]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260204112056_AddCMSTables', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Sports]') AND [c].[name] = N'ContactInfo');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Sports] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Sports] DROP COLUMN [ContactInfo];
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Sports]') AND [c].[name] = N'Order');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Sports] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [Sports] DROP COLUMN [Order];
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Sports]') AND [c].[name] = N'Schedule');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Sports] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [Sports] DROP COLUMN [Schedule];
GO

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InstitutionalPartners]') AND [c].[name] = N'Description');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [InstitutionalPartners] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [InstitutionalPartners] DROP COLUMN [Description];
GO

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InstitutionalPartners]') AND [c].[name] = N'Order');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [InstitutionalPartners] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [InstitutionalPartners] DROP COLUMN [Order];
GO

ALTER TABLE [Users] ADD [PasswordResetToken] nvarchar(100) NULL;
GO

ALTER TABLE [Users] ADD [PasswordResetTokenExpires] datetime2 NULL;
GO

UPDATE [Users] SET [CreatedAt] = '2026-02-04T14:47:57.8245955Z', [MemberSince] = '2026-02-04T14:47:57.8245948Z', [PasswordHash] = N'$2a$11$KgBx5YVd9jU8bTX.Fb0fZuKlLazpxRaHK7TKhzpET4CntpzIH5eG.', [PasswordResetToken] = NULL, [PasswordResetTokenExpires] = NULL
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260204144758_AddPasswordResetFields', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [NewsImages] (
    [Id] int NOT NULL IDENTITY,
    [NewsArticleId] int NOT NULL,
    [ImageUrl] nvarchar(500) NOT NULL,
    [Order] int NOT NULL DEFAULT 0,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_NewsImages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_NewsImages_NewsArticles_NewsArticleId] FOREIGN KEY ([NewsArticleId]) REFERENCES [NewsArticles] ([Id]) ON DELETE CASCADE
);
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-07T20:00:20.6671768Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-07T20:00:20.6671771Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-07T20:00:20.8662775Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-07T20:00:20.8662183Z', [PasswordHash] = N'$2a$11$/.Yw9Q72ctHk.s85BVUJaui2fFAExSqo8xfVneTD7iELOrLfnw/Hq'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_NewsImages_NewsArticleId] ON [NewsImages] ([NewsArticleId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260207200021_AddNewsImageGallery', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Events] (
    [Id] int NOT NULL IDENTITY,
    [Title] nvarchar(200) NOT NULL,
    [EventType] int NOT NULL,
    [StartDateTime] datetime2 NOT NULL,
    [EndDateTime] datetime2 NOT NULL,
    [TeamId] int NULL,
    [SportId] int NOT NULL,
    [Location] nvarchar(200) NULL,
    [Description] nvarchar(1000) NULL,
    [OpponentName] nvarchar(100) NULL,
    [IsHomeGame] bit NULL,
    [CreatedBy] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_Events] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Events_Sports_SportId] FOREIGN KEY ([SportId]) REFERENCES [Sports] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Events_Teams_TeamId] FOREIGN KEY ([TeamId]) REFERENCES [Teams] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Events_Users_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-16T10:03:47.0469639Z', [Description] = N'Acesso padrão de utilizador'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-16T10:03:47.0469640Z', [Description] = N'Administrador com acesso total'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-16T10:03:47.1686403Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-16T10:03:47.1685968Z', [PasswordHash] = N'$2a$11$wCi8U6jFOtUw3LP.02lcKu/ZrUEBrbyEEBXO2qzzhUwnujIK1yRWK'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_Events_CreatedBy] ON [Events] ([CreatedBy]);
GO

CREATE INDEX [IX_Events_SportId] ON [Events] ([SportId]);
GO

CREATE INDEX [IX_Events_TeamId] ON [Events] ([TeamId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260216100347_AddEventsTable', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [TrainingSchedules] (
    [Id] int NOT NULL IDENTITY,
    [TeamId] int NOT NULL,
    [DaysOfWeek] nvarchar(max) NOT NULL,
    [StartTime] time NOT NULL,
    [EndTime] time NOT NULL,
    [Location] nvarchar(200) NULL,
    [ValidFrom] datetime2 NOT NULL,
    [ValidUntil] datetime2 NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedBy] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_TrainingSchedules] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TrainingSchedules_Teams_TeamId] FOREIGN KEY ([TeamId]) REFERENCES [Teams] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_TrainingSchedules_Users_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-16T10:23:13.9125881Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-16T10:23:13.9125882Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-16T10:23:14.0389829Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-16T10:23:14.0389379Z', [PasswordHash] = N'$2a$11$vZJQiP4mNnV/QSAr8cpp3uxqTpMsVJCNZn6Swoee9TqLZFX3dGHN.'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_TrainingSchedules_CreatedBy] ON [TrainingSchedules] ([CreatedBy]);
GO

CREATE INDEX [IX_TrainingSchedules_TeamId] ON [TrainingSchedules] ([TeamId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260216102314_AddTrainingSchedules', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Attendances] (
    [Id] int NOT NULL IDENTITY,
    [EventId] int NOT NULL,
    [AthleteId] int NOT NULL,
    [Status] int NOT NULL,
    [Reason] nvarchar(500) NULL,
    [RecordedBy] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_Attendances] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Attendances_AthleteProfiles_AthleteId] FOREIGN KEY ([AthleteId]) REFERENCES [AthleteProfiles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Attendances_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE CASCADE
);
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T09:40:16.7734544Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T09:40:16.7734546Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-18T09:40:16.9770550Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-18T09:40:16.9769554Z', [PasswordHash] = N'$2a$11$zKwKq5xpGkd6fHhwQ23qleNGZlqaZCsuNKBTZIfA.B2dx/eutqEBy'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_Attendances_AthleteId] ON [Attendances] ([AthleteId]);
GO

CREATE UNIQUE INDEX [IX_Attendances_EventId_AthleteId] ON [Attendances] ([EventId], [AthleteId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260218094017_AddAttendanceTable', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [GameCallUps] (
    [Id] int NOT NULL IDENTITY,
    [EventId] int NOT NULL,
    [AthleteId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_GameCallUps] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_GameCallUps_AthleteProfiles_AthleteId] FOREIGN KEY ([AthleteId]) REFERENCES [AthleteProfiles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_GameCallUps_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE CASCADE
);
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T10:01:42.7742300Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T10:01:42.7742301Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-18T10:01:42.9608330Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-18T10:01:42.9607482Z', [PasswordHash] = N'$2a$11$/vPl.aKvvVuC0gBWbM9mc.dBNp6qeu.N2gRRzFwrhVRSSydy6.yKG'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_GameCallUps_AthleteId] ON [GameCallUps] ([AthleteId]);
GO

CREATE UNIQUE INDEX [IX_GameCallUps_EventId_AthleteId] ON [GameCallUps] ([EventId], [AthleteId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260218100143_AddGameCallUpTable', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Sports] ADD [MonthlyFee] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

CREATE TABLE [SystemSettings] (
    [Key] nvarchar(100) NOT NULL,
    [Value] nvarchar(max) NOT NULL,
    [Description] nvarchar(255) NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_SystemSettings] PRIMARY KEY ([Key])
);
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T10:17:22.6516746Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T10:17:22.6516748Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-18T10:17:22.7928678Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-18T10:17:22.7928169Z', [PasswordHash] = N'$2a$11$Xvm/NxQzy./3fNQMJf7P1u57GxO9rNPLbWEu75V6jfwEEAIRbsl/W'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260218101723_AddSystemSettingsAndSportFee', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Payments] ADD [Entity] nvarchar(20) NULL;
GO

ALTER TABLE [Payments] ADD [Reference] nvarchar(20) NULL;
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T10:47:56.1098836Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T10:47:56.1098838Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-18T10:47:56.2321801Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-18T10:47:56.2321295Z', [PasswordHash] = N'$2a$11$RabPw.mDpDFE9JzUd9cKu.xufVjqxPtqsi1oaGPOHilcGIQ6BuLR2'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260218104756_AddPaymentReferenceFields', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Payments] ADD [PeriodMonth] int NULL;
GO

ALTER TABLE [Payments] ADD [PeriodYear] int NULL;
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T11:02:34.6193666Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T11:02:34.6193668Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-18T11:02:34.7546747Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-18T11:02:34.7546065Z', [PasswordHash] = N'$2a$11$WUbpKx.7ZuLazSe0sgzCCuZCxkpGYBqn3VBT83t4KvPwcNtwHI4uu'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260218110235_AddPeriodsReferences', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DROP INDEX [IX_AthleteProfiles_UserId] ON [AthleteProfiles];
GO

ALTER TABLE [AthleteProfiles] ADD [FirstName] nvarchar(100) NULL;
GO

ALTER TABLE [AthleteProfiles] ADD [LastName] nvarchar(100) NULL;
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T15:11:04.2815998Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T15:11:04.2816000Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-18T15:11:04.4013361Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-18T15:11:04.4012831Z', [PasswordHash] = N'$2a$11$qMHikwx5RivDaXo4KSvWw.TyRpt8ocps143a0cjQfWoDkY6ykJBjy'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_AthleteProfiles_UserId] ON [AthleteProfiles] ([UserId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260218151104_MultipleAthleteProfiles', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DROP INDEX [IX_AthleteProfiles_UserId] ON [AthleteProfiles];
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T15:46:02.7325320Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-18T15:46:02.7325322Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-18T15:46:02.8600130Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-18T15:46:02.8599824Z', [PasswordHash] = N'$2a$11$P2cLmzp5e7lCQR77s1Vr0O7/px83krXhwLd0j2GyZFXEOuqzLuAkO'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

                DELETE FROM "AthleteProfiles"
                WHERE "Id" NOT IN (
                    SELECT MIN("Id")
                    FROM "AthleteProfiles"
                    GROUP BY "UserId"
                )
GO

CREATE UNIQUE INDEX [IX_AthleteProfiles_UserId] ON [AthleteProfiles] ([UserId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260218154603_RevertToSingleAthleteProfile', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [FamilyAssociationRequests] (
    [Id] int NOT NULL IDENTITY,
    [RequesterId] int NOT NULL,
    [FamilyMemberName] nvarchar(200) NOT NULL,
    [FamilyMemberNif] nvarchar(9) NULL,
    [FamilyMemberBirthDate] datetime2 NULL,
    [RequesterMessage] nvarchar(500) NULL,
    [Status] int NOT NULL DEFAULT 0,
    [RequestedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [SeenAt] datetime2 NULL,
    CONSTRAINT [PK_FamilyAssociationRequests] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_FamilyAssociationRequests_Users_RequesterId] FOREIGN KEY ([RequesterId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-23T10:14:40.5449337Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-23T10:14:40.5449339Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-23T10:14:40.6659053Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-23T10:14:40.6658539Z', [PasswordHash] = N'$2a$11$jtJU6Svlb6jx9bZazJ/05uogPADXzWIlE/QDHVH0QSUFjW0wg.Cwe'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_FamilyAssociationRequests_RequesterId] ON [FamilyAssociationRequests] ([RequesterId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260223101441_AddFamilyAssociationRequest', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [UserFamilyLinks] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [LinkedUserId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_UserFamilyLinks] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UserFamilyLinks_Users_LinkedUserId] FOREIGN KEY ([LinkedUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_UserFamilyLinks_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-23T10:33:34.3145462Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-23T10:33:34.3145464Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-23T10:33:34.4498183Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-23T10:33:34.4497763Z', [PasswordHash] = N'$2a$11$PpMqDJaN7Mfs5WrsF8Ro6OutWR1jIfNNWUpcKhcgjgdWhxmsUTU8K'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_UserFamilyLinks_LinkedUserId] ON [UserFamilyLinks] ([LinkedUserId]);
GO

CREATE UNIQUE INDEX [IX_UserFamilyLinks_UserId_LinkedUserId] ON [UserFamilyLinks] ([UserId], [LinkedUserId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260223103334_AddUserFamilyLink', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [UserFamilyLinks] ADD [Relationship] nvarchar(50) NULL;
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-23T15:00:36.1571026Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-23T15:00:36.1571028Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-23T15:00:36.2781010Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-23T15:00:36.2780596Z', [PasswordHash] = N'$2a$11$aVm.nqn4L3zLhuUPxd3sbuoKKiPWNnhB5vsPyIZr6MZT5ubnFPe1.'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260223150036_AddRelationshipToFamilyLink', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Sports] ADD [FeeEscalao1Normal] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

ALTER TABLE [Sports] ADD [FeeEscalao1Sibling] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

ALTER TABLE [Sports] ADD [FeeEscalao2Normal] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

ALTER TABLE [Sports] ADD [FeeEscalao2Sibling] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

ALTER TABLE [Sports] ADD [InscriptionFeeDiscount] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

ALTER TABLE [Sports] ADD [InscriptionFeeNormal] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

ALTER TABLE [Sports] ADD [QuotaIncluded] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [AthleteTeams] ADD [Escalao] nvarchar(50) NULL;
GO

ALTER TABLE [AthleteTeams] ADD [InscriptionPaid] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [AthleteTeams] ADD [InscriptionPaidDate] datetime2 NULL;
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-24T18:31:48.8321354Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-24T18:31:48.8321356Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-24T18:31:49.0046843Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-24T18:31:49.0046208Z', [PasswordHash] = N'$2a$11$OOtv2frdFOpreS5c1qvtC.dO1ru/ude5aSUb.nUlYMfAZzHbCVnUS'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260224183149_UpdateSportFeeFields', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [EscalaoRequests] (
    [Id] int NOT NULL IDENTITY,
    [AthleteProfileId] int NOT NULL,
    [DocumentUrl] nvarchar(500) NOT NULL,
    [Status] int NOT NULL DEFAULT 0,
    [AdminNote] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ReviewedAt] datetime2 NULL,
    [ReviewedByUserId] int NULL,
    CONSTRAINT [PK_EscalaoRequests] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EscalaoRequests_AthleteProfiles_AthleteProfileId] FOREIGN KEY ([AthleteProfileId]) REFERENCES [AthleteProfiles] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_EscalaoRequests_AthleteProfileId] ON [EscalaoRequests] ([AthleteProfileId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260225095929_AddEscalaoRequest', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Sports] ADD [FeeNormalNormal] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

ALTER TABLE [Sports] ADD [FeeNormalSibling] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-25T12:32:43.2102637Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-25T12:32:43.2102639Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-25T12:32:43.3328292Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-25T12:32:43.3327839Z', [PasswordHash] = N'$2a$11$OLbwsl.eZOtgk88hoRge5uXrui64wwgwk4ydRRY9WIkpGs9mBVp3u'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260225123243_AddNormalFeesToSport', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Sports]') AND [c].[name] = N'FeeEscalao1Sibling');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [Sports] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [Sports] DROP COLUMN [FeeEscalao1Sibling];
GO

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Sports]') AND [c].[name] = N'FeeEscalao2Sibling');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Sports] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [Sports] DROP COLUMN [FeeEscalao2Sibling];
GO

DECLARE @var7 sysname;
SELECT @var7 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Sports]') AND [c].[name] = N'FeeNormalSibling');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [Sports] DROP CONSTRAINT [' + @var7 + '];');
ALTER TABLE [Sports] DROP COLUMN [FeeNormalSibling];
GO

EXEC sp_rename N'[Sports].[InscriptionFeeDiscount]', N'FeeDiscount', N'COLUMN';
GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-25T15:36:44.8594624Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-02-25T15:36:44.8594626Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-02-25T15:36:44.9910781Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-02-25T15:36:44.9910289Z', [PasswordHash] = N'$2a$11$NqbT6S1d9fF73ih5N0B4ROrgAF.Ir5iY/eb1W/RB5UfWHOHjRYQdC'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260225153645_SimplifyFeeFields', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Escalaos] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_Escalaos] PRIMARY KEY ([Id])
);
GO

IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'IsActive', N'Name') AND [object_id] = OBJECT_ID(N'[Escalaos]'))
    SET IDENTITY_INSERT [Escalaos] ON;
INSERT INTO [Escalaos] ([Id], [CreatedAt], [IsActive], [Name])
VALUES (1, '2026-01-01T00:00:00.0000000Z', CAST(1 AS bit), N'Sub-7'),
(2, '2026-01-01T00:00:00.0000000Z', CAST(1 AS bit), N'Sub-9'),
(3, '2026-01-01T00:00:00.0000000Z', CAST(1 AS bit), N'Sub-11'),
(4, '2026-01-01T00:00:00.0000000Z', CAST(1 AS bit), N'Sub-13'),
(5, '2026-01-01T00:00:00.0000000Z', CAST(1 AS bit), N'Sub-15'),
(6, '2026-01-01T00:00:00.0000000Z', CAST(1 AS bit), N'Sub-17'),
(7, '2026-01-01T00:00:00.0000000Z', CAST(1 AS bit), N'Sub-19'),
(8, '2026-01-01T00:00:00.0000000Z', CAST(1 AS bit), N'Sénior');
IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'IsActive', N'Name') AND [object_id] = OBJECT_ID(N'[Escalaos]'))
    SET IDENTITY_INSERT [Escalaos] OFF;
GO

UPDATE [Roles] SET [CreatedAt] = '2026-03-02T10:50:48.3416191Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Roles] SET [CreatedAt] = '2026-03-02T10:50:48.3416193Z'
WHERE [Id] = 2;
SELECT @@ROWCOUNT;

GO

UPDATE [UserRoles] SET [AssignedAt] = '2026-03-02T10:50:48.4620257Z'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

UPDATE [Users] SET [CreatedAt] = '2026-03-02T10:50:48.4619707Z', [PasswordHash] = N'$2a$11$SVbHwB1V3KxftGXKMJW2Gu5iF9iCFNHaMcTmtqypcpH9G2i2KSkmS'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE UNIQUE INDEX [IX_Escalaos_Name] ON [Escalaos] ([Name]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260302105048_AddEscalaoTable', N'8.0.0');
GO

COMMIT;
GO


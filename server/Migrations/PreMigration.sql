-- Pre-migration script: Create MemberProfiles for existing Users BEFORE applying EF migration
-- This ensures Payments FK will have valid MemberProfileIds to reference

PRINT 'Pre-migration: Creating MemberProfiles and UserRoles for existing Users...';

-- Check if tables already exist (migration may have partially run)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    PRINT 'Roles table does not exist. Run the EF migration first.';
END
ELSE
BEGIN
    PRINT 'Roles table exists. Checking for existing data...';
    
    -- Create MemberProfiles for all existing Users who don't already have one
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MemberProfiles')
    BEGIN
        PRINT 'MemberProfiles table does not exist. Run the EF migration first.';
    END
    ELSE
    BEGIN
        INSERT INTO [MemberProfiles] ([UserId], [MembershipNumber], [MembershipStatus], [MemberSince], [CreatedAt])
        SELECT 
            u.[Id],
            'CDP-' + RIGHT('000000' + CAST(ROW_NUMBER() OVER (ORDER BY u.[Id]) AS VARCHAR), 6),
            0, -- Pending status
            u.[CreatedAt],
            GETUTCDATE()
        FROM [Users] u
        WHERE NOT EXISTS (SELECT 1 FROM [MemberProfiles] mp WHERE mp.[UserId] = u.[Id]);
        
        PRINT 'MemberProfiles created: ' + CAST(@@ROWCOUNT AS VARCHAR);
        
        -- Create UserRoles for all existing Users who don't already have one
        INSERT INTO [UserRoles] ([UserId], [RoleId], [AssignedAt])
        SELECT 
            u.[Id],
            1, -- Default to User role
            GETUTCDATE()
        FROM [Users] u
        WHERE NOT EXISTS (SELECT 1 FROM [UserRoles] ur WHERE ur.[UserId] = u.[Id]);
        
        PRINT 'UserRoles created: ' + CAST(@@ROWCOUNT AS VARCHAR);
    END
END

PRINT 'Pre-migration complete';

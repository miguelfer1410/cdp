-- Complete the migration by dropping all constraints and old columns
BEGIN TRANSACTION;

PRINT 'Completing migration...';

-- Drop all default constraints on columns we want to remove
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql += 'ALTER TABLE [Users] DROP CONSTRAINT ' + QUOTENAME(dc.name) + ';' + CHAR(13)
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE dc.parent_object_id = OBJECT_ID('Users')
AND c.name IN ('Role', 'UserType', 'MembershipStatus', 'MemberSince');

IF LEN(@sql) > 0
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Dropped all default constraints';
END

-- Now drop the old columns from Users table
ALTER TABLE [Users] DROP COLUMN [UserType];
PRINT 'Dropped UserType column';

ALTER TABLE [Users] DROP COLUMN [Role];
PRINT 'Dropped Role column';

ALTER TABLE [Users] DROP COLUMN [MembershipStatus];
PRINT 'Dropped MembershipStatus column';

ALTER TABLE [Users] DROP COLUMN [MemberSince];
PRINT 'Dropped MemberSince column';

COMMIT TRANSACTION;

PRINT '=========================================';
PRINT 'Migration completed successfully!';
PRINT '=========================================';

-- ============================================================
-- Script: delete_athlete_payments.sql
-- Purpose: Delete payments from athlete accounts created BETWEEN
--          2026-03-24 09:46:17.7472778 AND 2026-03-24 12:32:37.1700000 (inclusive)
-- Logic:
--   Payment -> MemberProfile -> User -> AthleteProfile (exists = athlete)
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: PREVIEW — verify which records will be deleted
-- -------------------------------------------------------
SELECT
    p.Id             AS PaymentId,
    p.MemberProfileId,
    p.Amount,
    p.PaymentDate,
    p.Status,
    p.Description,
    p.CreatedAt,
    u.FirstName + ' ' + u.LastName AS AthleteFullName,
    u.Email
FROM Payments p
INNER JOIN MemberProfiles mp ON mp.Id = p.MemberProfileId
INNER JOIN Users          u  ON u.Id  = mp.UserId
INNER JOIN AthleteProfiles ap ON ap.UserId = u.Id
WHERE p.CreatedAt BETWEEN '2026-03-24 09:46:17.7472778' AND '2026-03-24 12:32:37.1700000'
ORDER BY p.CreatedAt;

-- -------------------------------------------------------
-- STEP 2: DELETE — after confirming the preview above
--         Uncomment the block below to proceed
-- -------------------------------------------------------

/*
DELETE p
FROM Payments p
INNER JOIN MemberProfiles mp ON mp.Id = p.MemberProfileId
INNER JOIN Users          u  ON u.Id  = mp.UserId
INNER JOIN AthleteProfiles ap ON ap.UserId = u.Id
WHERE p.CreatedAt BETWEEN '2026-03-24 09:46:17.7472778' AND '2026-03-24 12:32:37.1700000';

-- Confirm how many rows were deleted
PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' payment(s) deleted.';
*/

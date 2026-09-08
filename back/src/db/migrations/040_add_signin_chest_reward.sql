-- The welcome chests handed out for signing in, and the flag that makes it
-- happen exactly once per account.
--
-- Defaults to true for every row that already exists: those accounts were
-- granted their chests by hand before this existed, and without the backfill
-- they would all collect a second set on their next sign-in. Only rows
-- created from here on start at false.
ALTER TABLE users ADD COLUMN signin_chests_granted BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET signin_chests_granted = true;
ALTER TABLE users ALTER COLUMN signin_chests_granted SET DEFAULT false;

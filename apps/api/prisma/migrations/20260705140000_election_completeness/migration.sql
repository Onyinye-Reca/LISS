-- Election completeness (PRD 4.11): candidate photos, a per-vote audit IP, and
-- an explicit "results published" flag. All additive/nullable, so existing
-- deployed code keeps working. ADD COLUMN is DDL and does not trip the votes
-- immutability trigger (which only blocks row UPDATE/DELETE).
ALTER TABLE "candidates" ADD COLUMN "photo_url" TEXT;
ALTER TABLE "votes" ADD COLUMN "ip_address" TEXT;
ALTER TABLE "elections" ADD COLUMN "results_published" BOOLEAN NOT NULL DEFAULT false;

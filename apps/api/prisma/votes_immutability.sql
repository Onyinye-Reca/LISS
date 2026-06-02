-- Tamper-proofing for the votes table (PRD 4.11 / 7.2): votes are INSERT-only.
-- Run this once after the initial migration, or paste it into a Prisma
-- migration file so it ships with the schema:
--
--   npx prisma migrate dev --create-only --name votes_immutability
--   # then paste the body below into the generated migration.sql and re-run migrate
--
-- The trigger raises on any UPDATE or DELETE, so a compromised app account
-- still cannot alter or remove a cast vote.

CREATE OR REPLACE FUNCTION prevent_vote_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'votes are immutable: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS votes_no_update ON votes;
CREATE TRIGGER votes_no_update
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION prevent_vote_mutation();

DROP TRIGGER IF EXISTS votes_no_delete ON votes;
CREATE TRIGGER votes_no_delete
  BEFORE DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION prevent_vote_mutation();

-- Dues year on payments (PRD 4.9 / US-010): dues carry the year they cover;
-- donations leave it null. Nullable/additive, so existing code keeps working.
ALTER TABLE "payments" ADD COLUMN "year" INTEGER;

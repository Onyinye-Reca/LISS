-- Add an optional subject to contact messages (used for email routing).
ALTER TABLE "contact_messages" ADD COLUMN "subject" TEXT;

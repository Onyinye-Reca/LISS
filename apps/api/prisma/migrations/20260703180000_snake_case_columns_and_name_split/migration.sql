-- Snake_case all DB columns (via @map) and split fullName -> first_name/last_name
-- on members, officers, and bot_members. Data-preserving (RENAME COLUMN +
-- backfill), so it is safe to run against populated databases.

-- === members: name split ===
ALTER TABLE "members" ADD COLUMN "first_name" TEXT;
ALTER TABLE "members" ADD COLUMN "last_name" TEXT;
UPDATE "members" SET
  "first_name" = split_part("fullName", ' ', 1),
  "last_name"  = CASE WHEN strpos("fullName", ' ') > 0
                      THEN substring("fullName" FROM strpos("fullName", ' ') + 1)
                      ELSE '' END;
ALTER TABLE "members" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "members" ALTER COLUMN "last_name" SET NOT NULL;
ALTER TABLE "members" DROP COLUMN "fullName";

-- === members: column renames ===
ALTER TABLE "members" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "members" RENAME COLUMN "tokenVersion" TO "token_version";
ALTER TABLE "members" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "members" RENAME COLUMN "updatedAt" TO "updated_at";

-- === verification_tokens ===
ALTER TABLE "verification_tokens" RENAME COLUMN "tokenHash" TO "token_hash";
ALTER TABLE "verification_tokens" RENAME COLUMN "memberId" TO "member_id";
ALTER TABLE "verification_tokens" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "verification_tokens" RENAME COLUMN "createdAt" TO "created_at";

-- === password_reset_tokens ===
ALTER TABLE "password_reset_tokens" RENAME COLUMN "tokenHash" TO "token_hash";
ALTER TABLE "password_reset_tokens" RENAME COLUMN "memberId" TO "member_id";
ALTER TABLE "password_reset_tokens" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "password_reset_tokens" RENAME COLUMN "createdAt" TO "created_at";

-- === elections ===
ALTER TABLE "elections" RENAME COLUMN "isOpen" TO "is_open";
ALTER TABLE "elections" RENAME COLUMN "opensAt" TO "opens_at";
ALTER TABLE "elections" RENAME COLUMN "closesAt" TO "closes_at";
ALTER TABLE "elections" RENAME COLUMN "createdAt" TO "created_at";

-- === positions ===
ALTER TABLE "positions" RENAME COLUMN "electionId" TO "election_id";

-- === candidates ===
ALTER TABLE "candidates" RENAME COLUMN "positionId" TO "position_id";

-- === votes ===
ALTER TABLE "votes" RENAME COLUMN "memberId" TO "member_id";
ALTER TABLE "votes" RENAME COLUMN "electionId" TO "election_id";
ALTER TABLE "votes" RENAME COLUMN "positionId" TO "position_id";
ALTER TABLE "votes" RENAME COLUMN "candidateId" TO "candidate_id";
ALTER TABLE "votes" RENAME COLUMN "castAt" TO "cast_at";

-- === contact_messages ===
ALTER TABLE "contact_messages" RENAME COLUMN "createdAt" TO "created_at";

-- === payments ===
ALTER TABLE "payments" RENAME COLUMN "memberId" TO "member_id";
ALTER TABLE "payments" RENAME COLUMN "createdAt" TO "created_at";

-- === officers: name split ===
ALTER TABLE "officers" ADD COLUMN "first_name" TEXT;
ALTER TABLE "officers" ADD COLUMN "last_name" TEXT;
UPDATE "officers" SET
  "first_name" = split_part("fullName", ' ', 1),
  "last_name"  = CASE WHEN strpos("fullName", ' ') > 0
                      THEN substring("fullName" FROM strpos("fullName", ' ') + 1)
                      ELSE '' END;
ALTER TABLE "officers" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "officers" ALTER COLUMN "last_name" SET NOT NULL;
ALTER TABLE "officers" DROP COLUMN "fullName";

-- === officers: column renames ===
ALTER TABLE "officers" RENAME COLUMN "termStart" TO "term_start";
ALTER TABLE "officers" RENAME COLUMN "termEnd" TO "term_end";
ALTER TABLE "officers" RENAME COLUMN "photoUrl" TO "photo_url";
ALTER TABLE "officers" RENAME COLUMN "isPast" TO "is_past";
ALTER TABLE "officers" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "officers" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "officers" RENAME COLUMN "updatedAt" TO "updated_at";

-- === bot_members: name split ===
ALTER TABLE "bot_members" ADD COLUMN "first_name" TEXT;
ALTER TABLE "bot_members" ADD COLUMN "last_name" TEXT;
UPDATE "bot_members" SET
  "first_name" = split_part("fullName", ' ', 1),
  "last_name"  = CASE WHEN strpos("fullName", ' ') > 0
                      THEN substring("fullName" FROM strpos("fullName", ' ') + 1)
                      ELSE '' END;
ALTER TABLE "bot_members" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "bot_members" ALTER COLUMN "last_name" SET NOT NULL;
ALTER TABLE "bot_members" DROP COLUMN "fullName";

-- === bot_members: column renames ===
ALTER TABLE "bot_members" RENAME COLUMN "photoUrl" TO "photo_url";
ALTER TABLE "bot_members" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "bot_members" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "bot_members" RENAME COLUMN "updatedAt" TO "updated_at";

-- === regions ===
ALTER TABLE "regions" RENAME COLUMN "repName" TO "rep_name";
ALTER TABLE "regions" RENAME COLUMN "repEmail" TO "rep_email";
ALTER TABLE "regions" RENAME COLUMN "repWhatsapp" TO "rep_whatsapp";
ALTER TABLE "regions" RENAME COLUMN "memberCount" TO "member_count";
ALTER TABLE "regions" RENAME COLUMN "updatedAt" TO "updated_at";

-- === announcements ===
ALTER TABLE "announcements" RENAME COLUMN "coverUrl" TO "cover_url";
ALTER TABLE "announcements" RENAME COLUMN "publishedAt" TO "published_at";
ALTER TABLE "announcements" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "announcements" RENAME COLUMN "updatedAt" TO "updated_at";

-- === albums ===
ALTER TABLE "albums" RENAME COLUMN "coverUrl" TO "cover_url";
ALTER TABLE "albums" RENAME COLUMN "eventDate" TO "event_date";
ALTER TABLE "albums" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "albums" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "albums" RENAME COLUMN "updatedAt" TO "updated_at";

-- === gallery_images ===
ALTER TABLE "gallery_images" RENAME COLUMN "albumId" TO "album_id";
ALTER TABLE "gallery_images" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "gallery_images" RENAME COLUMN "createdAt" TO "created_at";

-- === events ===
ALTER TABLE "events" RENAME COLUMN "startsAt" TO "starts_at";
ALTER TABLE "events" RENAME COLUMN "endsAt" TO "ends_at";
ALTER TABLE "events" RENAME COLUMN "coverUrl" TO "cover_url";
ALTER TABLE "events" RENAME COLUMN "isPublic" TO "is_public";
ALTER TABLE "events" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "events" RENAME COLUMN "updatedAt" TO "updated_at";

-- === event_rsvps ===
ALTER TABLE "event_rsvps" RENAME COLUMN "eventId" TO "event_id";
ALTER TABLE "event_rsvps" RENAME COLUMN "memberId" TO "member_id";
ALTER TABLE "event_rsvps" RENAME COLUMN "createdAt" TO "created_at";

-- === site_settings ===
ALTER TABLE "site_settings" RENAME COLUMN "updatedAt" TO "updated_at";

-- === blog_posts ===
ALTER TABLE "blog_posts" RENAME COLUMN "coverUrl" TO "cover_url";
ALTER TABLE "blog_posts" RENAME COLUMN "isPublished" TO "is_published";
ALTER TABLE "blog_posts" RENAME COLUMN "publishedAt" TO "published_at";
ALTER TABLE "blog_posts" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "blog_posts" RENAME COLUMN "updatedAt" TO "updated_at";

-- === financial_statements ===
ALTER TABLE "financial_statements" RENAME COLUMN "fileRef" TO "file_ref";
ALTER TABLE "financial_statements" RENAME COLUMN "fileName" TO "file_name";
ALTER TABLE "financial_statements" RENAME COLUMN "uploadedAt" TO "uploaded_at";
ALTER TABLE "financial_statements" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "financial_statements" RENAME COLUMN "updatedAt" TO "updated_at";

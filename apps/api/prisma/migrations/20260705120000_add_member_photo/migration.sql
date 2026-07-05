-- Profile picture for members. Nullable so existing members stay valid; the
-- register endpoint requires it for new sign-ups.
ALTER TABLE "members" ADD COLUMN "photo_url" TEXT;

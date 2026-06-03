-- CreateEnum
CREATE TYPE "OfficerTier" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'PRO', 'TREASURER', 'OTHER');

-- CreateEnum
CREATE TYPE "RegionKey" AS ENUM ('SOUTH_SOUTH', 'SOUTH_EAST', 'SOUTH_WEST', 'NORTH', 'DIASPORA');

-- CreateTable
CREATE TABLE "officers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tier" "OfficerTier" NOT NULL DEFAULT 'OTHER',
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "termStart" INTEGER,
    "termEnd" INTEGER,
    "photoUrl" TEXT,
    "isPast" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_members" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "bio" TEXT,
    "email" TEXT,
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "key" "RegionKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repName" TEXT,
    "repEmail" TEXT,
    "repWhatsapp" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_key_key" ON "regions"("key");

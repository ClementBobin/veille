-- AlterTable
ALTER TABLE "Digest" ADD COLUMN "summary" TEXT;
ALTER TABLE "Digest" ADD COLUMN "title" TEXT;

-- CreateTable
CREATE TABLE "TocEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "digestId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    CONSTRAINT "TocEntry_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "Digest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TocEntryArticle" (
    "tocEntryId" TEXT NOT NULL,
    "feedItemId" TEXT NOT NULL,

    PRIMARY KEY ("tocEntryId", "feedItemId"),
    CONSTRAINT "TocEntryArticle_tocEntryId_fkey" FOREIGN KEY ("tocEntryId") REFERENCES "TocEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TocEntryArticle_feedItemId_fkey" FOREIGN KEY ("feedItemId") REFERENCES "FeedItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

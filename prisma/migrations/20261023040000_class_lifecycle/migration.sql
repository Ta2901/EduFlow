-- Existing rows stay "active" (treated as published). New classes default to draft.
ALTER TABLE "Class" ALTER COLUMN "status" SET DEFAULT 'draft';

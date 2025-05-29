-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/*
  Modified migration to handle existing Judge records:
  1. Add userId as nullable initially
  2. Create Users for existing Judges
  3. Link Judges to the new Users
  4. Make userId non-nullable
  5. Add unique constraint and foreign key
*/

-- Step 1: Add userId as nullable initially
ALTER TABLE "Judge" ADD COLUMN "userId" TEXT;

-- Step 2: Create Users for existing Judges and update the Judges with the new User IDs
DO $$
DECLARE
    judge_record RECORD;
    new_user_id TEXT;
BEGIN
    FOR judge_record IN SELECT id, name, email FROM "Judge" LOOP
        -- Create a User for each Judge
        INSERT INTO "User" (id, name, email, password, role)
        VALUES (
            gen_random_uuid()::TEXT,
            judge_record.name,
            judge_record.email,
            -- Create a randomly generated password (users will need to reset)
            crypt(gen_random_uuid()::TEXT, gen_salt('bf')),
            'JUDGE'
        )
        RETURNING id INTO new_user_id;
        
        -- Update the Judge with the User ID
        UPDATE "Judge" SET "userId" = new_user_id WHERE id = judge_record.id;
    END LOOP;
END;
$$;

-- Step 3: Drop the password column
ALTER TABLE "Judge" DROP COLUMN "password";

-- Step 4: Make userId non-nullable
ALTER TABLE "Judge" ALTER COLUMN "userId" SET NOT NULL;

-- Step 5: Add unique constraint and foreign key
CREATE UNIQUE INDEX "Judge_userId_key" ON "Judge"("userId");
ALTER TABLE "Judge" ADD CONSTRAINT "Judge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

# D1 Migrations

নতুন কোনো টেবিল/কলাম যোগ করলে এখানে `0001_something.sql` ধরনের ফাইল রাখুন।
ফাইলগুলো নাম অনুসারে sorted হয়ে ডেপ্লয়ের সময় স্বয়ংক্রিয়ভাবে চলে (`npm run db:migrate`)।

নিয়ম: SQL সবসময় idempotent লিখুন — `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` ইত্যাদি।

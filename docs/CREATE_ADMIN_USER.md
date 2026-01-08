# Admin User তৈরি করুন Supabase এ

## পদ্ধতি ১: Supabase Dashboard থেকে (সহজ)

### ধাপ ১: Authentication এ যান

1. Supabase Dashboard খুলুন: https://supabase.com/dashboard/project/qrnbpeowkkinjfksxavz
2. Left sidebar এ **"Authentication"** click করুন
3. **"Users"** tab এ click করুন

### ধাপ ২: User তৈরি করুন

1. **"Add User"** button (সবুজ button) click করুন
2. Form fill করুন:
   - **Email**: `admin@example.com` (অথবা আপনার email)
   - **Password**: `Admin@123` (অথবা আপনার পছন্দের password)
   - **Auto Confirm User**: ✅ এই checkbox টি check করুন (গুরুত্বপূর্ণ!)
3. **"Create User"** button click করুন
4. User তৈরি হয়ে যাবে
5. **User ID copy করুন** (একটি long string যেমন: `abc123-def456-...`)

### ধাপ ৩: Admin Role দিন

1. Supabase Dashboard এ **"SQL Editor"** তে যান
2. **"New Query"** click করুন
3. এই query টি paste করুন (USER_ID replace করুন):

```sql
-- আপনার copied User ID এখানে paste করুন
UPDATE profiles
SET role = 'owner', full_name = 'Admin User'
WHERE id = 'bce3a381-10af-4eac-b5b7-242d3f351ff2';
```

4. **"Run"** button click করুন
5. "1 row updated" message দেখবেন

### ধাপ ৪: Verify করুন

1. **"Table Editor"** → **"profiles"** table এ যান
2. আপনার user দেখতে পারবেন
3. Role column এ **"owner"** দেখবেন

## পদ্ধতি ২: SQL দিয়ে সরাসরি (Advanced)

```sql
-- User তৈরি করুন (Supabase Auth)
-- এটি শুধু SQL Editor থেকে করা যায় না
-- Dashboard থেকে করতে হবে

-- কিন্তু profile update করতে পারবেন:
INSERT INTO profiles (id, full_name, phone, role, is_active)
VALUES (
  'USER_ID_FROM_AUTH',
  'Admin User',
  '01712345678',
  'owner',
  true
);
```

## পদ্ধতি ৩: App থেকে Signup (পরে implement হবে)

Signup page implement হলে:

1. `/signup` page এ যান
2. Form fill করুন
3. Register করুন
4. তারপর SQL দিয়ে role update করুন

## ✅ Test Login

User তৈরি হলে:

1. App চালু করুন: `npm run dev`
2. Login page এ যান: http://localhost:3000/login
3. Email এবং Password দিয়ে login করুন
4. Dashboard এ redirect হবে

## 🔑 Default Admin Credentials

আপনি এই credentials use করতে পারেন:

- **Email**: `admin@example.com`
- **Password**: `Admin@123`

## ⚠️ Important Notes

1. **Auto Confirm User** checkbox অবশ্যই check করতে হবে
2. না হলে email verification লাগবে
3. User ID অবশ্যই copy করে profile update করতে হবে
4. Role না দিলে user login করতে পারবে কিন্তু কিছু access পাবে না

## 🆘 সমস্যা হলে

### "User already exists"

- ভিন্ন email use করুন
- অথবা existing user delete করে নতুন তৈরি করুন

### "Profile not found"

- SQL query তে User ID সঠিক আছে কিনা check করুন
- Single quote (' ') ব্যবহার করেছেন কিনা check করুন

### "Cannot login"

- Auto Confirm User check করেছেন কিনা verify করুন
- Password সঠিক আছে কিনা check করুন
- Email সঠিক আছে কিনা check করুন

---

**সংক্ষেপে**:

1. Authentication → Users → Add User
2. Email/Password দিন + Auto Confirm check করুন
3. User ID copy করুন
4. SQL দিয়ে role = 'owner' set করুন
5. Login করুন! ✅

# MFS Charge Updates - README

## সারসংক্ষেপ (Summary)

এই update এ MFS (Mobile Financial Service - bKash/Nagad) charge এর হিসাব আরো স্পষ্টভাবে দেখানোর ব্যবস্থা করা হয়েছে।

## পরিবর্তন সমূহ (Changes Made)

### ১. Staff/Person Advance এ MFS Charge দেখানো

**Location:**
- `app/(protected)/tender/[tenderId]/advances/give/page.tsx`
- `app/(protected)/tender/[tenderId]/advances/people/[personId]/page.tsx`

**পরিবর্তন:**
- MFS payment method নির্বাচন করলে এখন একটি সারসংক্ষেপ (Summary) card দেখাবে
- এই summary তে স্পষ্টভাবে দেখাবে:
  - **ব্যক্তি যা পাবেন:** ১০,০০০ টাকা (উদাহরণ)
  - **MFS চার্জ:** ১৯৫ টাকা
  - **আপনার মোট খরচ:** ১০,১৯৫ টাকা

**উদাহরণ:**
```
যখন আপনি staff কে ১০,০০০ টাকা দেবেন bKash এর মাধ্যমে:
- Staff পাবে: ১০,০০০ টাকা
- আপনার MFS charge: ১৯৫ টাকা (১.৮৫% + ১০ টাকা)
- মোট খরচ: ১০,১৯৫ টাকা

MFS charge টি আলাদাভাবে "activity_expenses" table এ সংরক্ষিত হবে।
```

### ২. Expense Rollup View ঠিক করা

**Problem:**
- MFS charges সঠিকভাবে `expense_rollup` view তে আসছিল না
- Code এ `activity_expenses` table ব্যবহার করা হয় কিন্তু view এ `expenses` table খোঁজা হচ্ছিল

**Solution:**
- নতুন SQL file তৈরি করা হয়েছে: `docs/FIX_EXPENSE_ROLLUP_MFS.sql`
- এই SQL file run করলে `expense_rollup` view ঠিক হয়ে যাবে
- এখন সব MFS charges সঠিকভাবে expense overview তে দেখাবে

**কিভাবে apply করবেন:**
1. Supabase SQL Editor এ যান
2. `docs/FIX_EXPENSE_ROLLUP_MFS.sql` file এর content copy করুন
3. SQL Editor এ paste করে Run করুন

### ৩. Expense Overview Page Link সরানো

**Location:**
- `app/(protected)/tender/[tenderId]/page.tsx`

**পরিবর্তন:**
- Tender dashboard থেকে "Expense Overview" এর link সরানো হয়েছে
- এর পরিবর্তে "Reports & Summary" link যোগ করা হয়েছে
- Expense Overview page এখনও আছে কিন্তু direct link নেই
- User চাইলে `/tender/{tenderId}/expenses/overview` manually type করে access করতে পারবে

## Current MFS Charge Implementation

### কোথায় কোথায় MFS Charge হিসাব হয়:

1. **Staff/Person Advances** ✅
   - Location: `advances/give`, `advances/people/[personId]`
   - Stored in: `activity_expenses` table
   - Description format: `[MFS CHARGE] Advance to Person Name (৳10000.00)`

2. **Labor Payments** ✅
   - Location: `labor/add`
   - Stored in: `activity_expenses` table
   - Description format: `[MFS CHARGE] Labor payment ৳10000.00`

3. **Vendor Payments** ✅ (Backward Compatible)
   - Location: `purchases/add`
   - Calculation: Auto-calculated from `vendor_payments` where `payment_method = 'mfs'`
   - Shown in: `expense_rollup` view

4. **Activity Expenses** ✅
   - Location: `activities/add`
   - Supports MFS payment method

## MFS Charge Calculation Formula

```
Base Amount: ১০,০০০ টাকা
Percentage Charge: ১০,০০০ × ০.০১৮৫ = ১৮৫ টাকা
Service Fee: ১০ টাকা
Total MFS Charge: ১৮৫ + ১০ = ১৯৫ টাকা
Total Cost to You: ১০,০০০ + ১৯৫ = ১০,১৯৫ টাকা
```

## Important Notes

1. **MFS Charge শুধু আপনার খরচ**
   - ব্যক্তির balance থেকে MFS charge কাটা হয় না
   - Full amount ব্যক্তি পায়
   - MFS charge আলাদা expense হিসেবে record হয়

2. **Database Structure**
   - MFS charges stored in: `activity_expenses` table
   - Description starts with: `[MFS CHARGE]`
   - Source type in view: `mfs_charge`

3. **Backward Compatibility**
   - Old vendor payments এর MFS charge auto-calculate হয়
   - Only if explicit charge entry না থাকলে

## Testing Checklist

- [ ] Staff advance দেওয়ার সময় MFS charge summary দেখা যাচ্ছে কিনা
- [ ] MFS charge সঠিকভাবে `activity_expenses` table এ save হচ্ছে কিনা
- [ ] Labor page এ MFS charges total দেখা যাচ্ছে কিনা
- [ ] Person advance hub এ actual cost (with MFS) দেখা যাচ্ছে কিনা
- [ ] SQL view fix run করার পর সব MFS charges দেখা যাচ্ছে কিনা

## Files Changed

1. `app/(protected)/tender/[tenderId]/advances/give/page.tsx` - Summary card added
2. `app/(protected)/tender/[tenderId]/advances/people/[personId]/page.tsx` - Summary card added
3. `app/(protected)/tender/[tenderId]/page.tsx` - Expense overview link removed
4. `docs/FIX_EXPENSE_ROLLUP_MFS.sql` - New SQL file to fix view

## Next Steps

1. **Run SQL Fix:**
   ```sql
   -- Copy and run from docs/FIX_EXPENSE_ROLLUP_MFS.sql
   ```

2. **Test the Changes:**
   - Give a staff advance with MFS payment
   - Check if MFS charge is shown clearly
   - Verify that the charge is recorded separately

3. **Optional - Delete Expense Overview:**
   - If you want to completely remove the page:
   ```
   Delete: app/(protected)/tender/[tenderId]/expenses/overview/page.tsx
   ```

## Support

যদি কোনো সমস্যা হয় তাহলে check করুন:
- Database তে `activity_expenses` table আছে কিনা
- `expense_rollup` view সঠিকভাবে তৈরি হয়েছে কিনা
- MFS charge entries এ `[MFS CHARGE]` prefix আছে কিনা

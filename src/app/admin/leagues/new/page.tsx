import { createClient } from '@/lib/supabase/server';
import { createLeague } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

export default async function NewLeaguePage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from('cities').select('id, name_ar').order('name_ar');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">دوري جديد</h1>

      <form action={createLeague} className="flex flex-col gap-4">
        <Field label="اسم الدوري" name="name" required placeholder="دوري جنين للهواة" />
        <Field label="الموسم" name="season" required placeholder="الموسم الأول" />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-text-dim">المدينة</span>
          <select
            name="city_id"
            required
            className="min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text focus:border-accent"
          >
            {cities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-text-dim">عدد الجولات</span>
          <select
            name="rounds"
            defaultValue="1"
            className="min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text focus:border-accent"
          >
            <option value="1">ذهاب فقط</option>
            <option value="2">ذهاب وإياب</option>
          </select>
        </label>

        <Field
          label="رسم الاشتراك (شيكل)"
          name="entry_fee"
          type="number"
          inputMode="decimal"
          dir="ltr"
          className="text-start tabular"
        />

        <Button type="submit" className="mt-1">
          إنشاء الدوري
        </Button>
      </form>
    </div>
  );
}

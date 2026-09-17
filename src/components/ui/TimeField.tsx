import { Input } from '@/components/ui/Input';

type TimeFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

/** Native fallback: Ozelo only ships as a web PWA today, so this is a plain
 * text field kept for completeness rather than a real wheel/clock picker. */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  return <Input label={label} value={value} onChangeText={onChange} placeholder="Ex: 08:00" keyboardType="numbers-and-punctuation" />;
}

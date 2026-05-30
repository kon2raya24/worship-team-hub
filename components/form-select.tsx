"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormSelectOption = { value: string; label: string };

/**
 * Native-form-friendly wrapper around the base-ui Select. Server pages render
 * it with serializable props; it submits via the hidden input (`name`) just
 * like a native `<select>`. Kept as a client component so it can use
 * `Select.Value`'s function child to show the selected option's label (a
 * function child can't cross the server→client boundary).
 */
export function FormSelect({
  name,
  options,
  id,
  placeholder = "Select…",
  required = false,
  defaultValue,
  triggerClassName = "w-full",
}: {
  name: string;
  options: FormSelectOption[];
  id?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  triggerClassName?: string;
}) {
  return (
    <Select name={name} required={required} defaultValue={defaultValue}>
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder={placeholder}>
          {(value: string | null) =>
            options.find((o) => o.value === value)?.label ?? placeholder
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

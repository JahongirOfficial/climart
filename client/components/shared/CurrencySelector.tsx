import { useMemo } from 'react';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { useCurrencies } from '@/hooks/useCurrencies';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  value: string;
  onValueChange: (code: string, exchangeRate: number) => void;
  className?: string;
  disabled?: boolean;
}

export const CurrencySelector = ({
  value,
  onValueChange,
  className,
  disabled,
}: CurrencySelectorProps) => {
  const { currencies, loading } = useCurrencies();

  const options: ComboboxOption[] = useMemo(
    () =>
      currencies
        .filter((c) => c.isActive)
        .map((c) => ({
          value: c.code,
          label: `${c.code} — ${c.symbol}`,
          description: c.isBase
            ? 'Asosiy valyuta'
            : `Kurs: 1 ${c.code} = ${new Intl.NumberFormat('ru-RU').format(c.exchangeRate)} so'm`,
        })),
    [currencies]
  );

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={(code) => {
        const currency = currencies.find((c) => c.code === code);
        onValueChange(code, currency?.exchangeRate ?? 1);
      }}
      placeholder="Valyuta..."
      searchPlaceholder="Valyuta qidirish..."
      emptyText="Valyuta topilmadi"
      disabled={disabled || loading}
      className={cn(className)}
    />
  );
};

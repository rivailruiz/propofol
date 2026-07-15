import { Minus, Plus } from 'lucide-react';

export function TargetButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'increase' | 'decrease';
  onClick: () => void;
  disabled?: boolean;
}) {
  const Icon = direction === 'increase' ? Plus : Minus;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'increase' ? 'Aumentar alvo' : 'Diminuir alvo'}
      className="flex h-11 flex-1 items-center justify-center rounded-md border border-chassis-500 bg-chassis-700 text-gray-100 transition-colors active:bg-chassis-600 disabled:opacity-40"
    >
      <Icon size={20} strokeWidth={2.5} />
    </button>
  );
}

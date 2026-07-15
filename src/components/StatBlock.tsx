export function StatBlock({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col leading-none">
      <span className="mb-0.5 text-[10px] text-gray-400">{label}</span>
      <span className="tabular text-base font-bold text-gray-100 sm:text-lg">
        {value}
        <span className="ml-1 text-[10px] font-medium text-gray-400">{unit}</span>
      </span>
    </div>
  );
}

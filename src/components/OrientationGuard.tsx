import { RotateCw } from 'lucide-react';

export function OrientationGuard() {
  return (
    <div className="orientation-guard fixed inset-0 z-50 flex-col items-center justify-center gap-5 bg-chassis-950 px-8 text-center">
      <RotateCw size={56} className="text-status-info" strokeWidth={1.5} />
      <p className="max-w-xs text-lg font-medium text-gray-100">
        Gire o dispositivo para usar o simulador em modo horizontal.
      </p>
      <span className="rounded border border-status-alarm/60 bg-status-alarm/10 px-2 py-1 text-[11px] font-semibold tracking-wide text-status-alarm">
        SIMULADOR — NÃO UTILIZAR EM PACIENTES
      </span>
    </div>
  );
}

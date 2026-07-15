export type AlarmSeverity = 'critical' | 'warning';

export type AlarmType =
  | 'occlusion'
  | 'air_in_line'
  | 'syringe_empty'
  | 'low_battery'
  | 'infusion_complete';

export interface AlarmDefinition {
  type: AlarmType;
  severity: AlarmSeverity;
  label: string;
  description: string;
}

export const ALARM_DEFINITIONS: Record<AlarmType, AlarmDefinition> = {
  occlusion: {
    type: 'occlusion',
    severity: 'critical',
    label: 'Oclusão na linha',
    description: 'Pressão elevada detectada — possível obstrução da via.',
  },
  air_in_line: {
    type: 'air_in_line',
    severity: 'critical',
    label: 'Ar na linha',
    description: 'Bolha de ar detectada no segmento de infusão.',
  },
  syringe_empty: {
    type: 'syringe_empty',
    severity: 'critical',
    label: 'Seringa vazia',
    description: 'Volume da seringa esgotado. Substitua a seringa.',
  },
  low_battery: {
    type: 'low_battery',
    severity: 'warning',
    label: 'Bateria baixa',
    description: 'Nível de bateria reduzido. Conecte à energia.',
  },
  infusion_complete: {
    type: 'infusion_complete',
    severity: 'warning',
    label: 'Infusão encerrada',
    description: 'A infusão foi encerrada pelo operador.',
  },
};

export interface ActiveAlarm {
  id: string;
  type: AlarmType;
  triggeredAt: number;
}

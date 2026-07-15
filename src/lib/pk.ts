/**
 * Motor de simulação farmacocinética simplificado (educacional).
 *
 * NÃO representa um modelo clínico validado (ex.: Marsh/Schnider/Eleveld).
 * As constantes foram escolhidas apenas para produzir curvas plausíveis
 * de concentração plasmática (Cp) e no local de efeito (Ce) reagindo a um
 * alvo de concentração plasmática (Cpt), como em uma bomba TCI real:
 * quando o alvo sobe, a bomba infunde para alcançá-lo; quando o alvo desce
 * abaixo de Cp, a bomba apenas para (não existe "infusão negativa") e a
 * concentração cai por redistribuição/eliminação.
 */

export interface PkConstants {
  /** Volume central "virtual" em mL */
  vc: number;
  /** Constante de eliminação (1/min) */
  k10: number;
  /** Constante de transferência central -> periférico (1/min) */
  k12: number;
  /** Constante de transferência periférico -> central (1/min) */
  k21: number;
  /** Constante de equilíbrio do local de efeito (1/min) */
  ke0: number;
  /** Ganho proporcional do controlador do alvo (1/min) */
  controllerGain: number;
}

export const DEFAULT_PK_CONSTANTS: PkConstants = {
  vc: 16000,
  k10: 0.119,
  k12: 0.112,
  k21: 0.055,
  ke0: 0.3,
  controllerGain: 1.5,
};

export interface PkState {
  /** Concentração plasmática estimada (µg/mL) */
  cp: number;
  /** Concentração no compartimento periférico (µg/mL), uso interno */
  cp2: number;
  /** Concentração no local de efeito estimada (µg/mL) */
  ce: number;
}

export interface PkStepInput {
  state: PkState;
  /** Alvo de concentração plasmática (µg/mL) */
  target: number;
  /** Segundos decorridos desde o último passo */
  dtSeconds: number;
  /** Concentração do fármaco na seringa (mg/mL) */
  drugConcentrationMgMl: number;
  /** Vazão máxima da bomba (mL/h) */
  maxFlowRateMlH: number;
  /** Volume restante na seringa (mL) — limita a vazão possível */
  syringeRemainingMl: number;
  /** Se falso, a bomba não infunde (pausada/parada) mas a PK continua evoluindo */
  infusing: boolean;
  constants?: PkConstants;
}

export interface PkStepResult {
  state: PkState;
  /** Vazão efetivamente aplicada nesta janela (mL/h) */
  flowRateMlH: number;
  /** Volume infundido nesta janela (mL) */
  volumeDeltaMl: number;
}

/**
 * Calcula a vazão (mL/h) necessária para que Cp se aproxime do alvo,
 * respeitando os limites físicos da bomba (vazão máxima e volume restante).
 * Nunca retorna vazão negativa: um alvo abaixo de Cp apenas interrompe a infusão.
 */
export function computeRequiredFlowRate(
  state: PkState,
  target: number,
  maxFlowRateMlH: number,
  drugConcentrationMgMl: number,
  constants: PkConstants,
): number {
  const { vc, k10, k12, k21, controllerGain } = constants;
  const { cp, cp2 } = state;

  const desiredDCpDt =
    controllerGain * (target - cp) + k10 * cp + k12 * cp - k21 * cp2;

  if (desiredDCpDt <= 0 || target <= 0) return 0;

  // µg/mL/min -> mg/min -> mL/min -> mL/h
  const massRateMgPerMin = (desiredDCpDt * vc) / 1000;
  const flowMlPerMin = massRateMgPerMin / drugConcentrationMgMl;
  const flowMlPerH = flowMlPerMin * 60;

  return clamp(flowMlPerH, 0, maxFlowRateMlH);
}

export function stepPk(input: PkStepInput): PkStepResult {
  const constants = input.constants ?? DEFAULT_PK_CONSTANTS;
  const { vc, k10, k12, k21, ke0 } = constants;
  const { cp, cp2, ce } = input.state;
  const dtMin = input.dtSeconds / 60;

  let flowRateMlH = 0;
  if (input.infusing && input.syringeRemainingMl > 0) {
    flowRateMlH = computeRequiredFlowRate(
      input.state,
      input.target,
      input.maxFlowRateMlH,
      input.drugConcentrationMgMl,
      constants,
    );
    const maxFlowFromSyringe =
      (input.syringeRemainingMl / Math.max(input.dtSeconds, 0.001)) * 3600;
    flowRateMlH = Math.min(flowRateMlH, maxFlowFromSyringe);
  }

  const inputRateConc =
    (((flowRateMlH / 60) * input.drugConcentrationMgMl * 1000) / vc) * 1; // µg/mL/min

  const dCpDt = inputRateConc - k10 * cp - k12 * cp + k21 * cp2;
  const dCp2Dt = k12 * cp - k21 * cp2;
  const dCeDt = ke0 * (cp - ce);

  const nextCp = Math.max(0, cp + dCpDt * dtMin);
  const nextCp2 = Math.max(0, cp2 + dCp2Dt * dtMin);
  const nextCe = Math.max(0, ce + dCeDt * dtMin);

  const volumeDeltaMl = flowRateMlH * (input.dtSeconds / 3600);

  return {
    state: { cp: nextCp, cp2: nextCp2, ce: nextCe },
    flowRateMlH,
    volumeDeltaMl,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

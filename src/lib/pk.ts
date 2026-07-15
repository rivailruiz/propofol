/**
 * Motor de simulação farmacocinética/farmacodinâmica do propofol,
 * baseado no modelo publicado de Schnider (adultos).
 *
 * Fontes:
 * - Schnider TW, Minto CF, Gambus PL, et al. "The influence of method
 *   of administration and covariates on the pharmacokinetics of
 *   propofol in adult volunteers." Anesthesiology. 1998;88(5):1170-1182.
 *   (volumes V1–V3, clareamentos Cl1–Cl3)
 * - Schnider TW, Minto CF, Shafer SL, et al. "The influence of age on
 *   propofol pharmacodynamics." Anesthesiology. 1999;90(6):1502-1516.
 *   (constante de equilíbrio do local de efeito, ke0 = 0.456 min⁻¹)
 *
 * Os coeficientes numéricos abaixo foram conferidos em duas revisões
 * secundárias antes de serem usados aqui (o PDF do artigo original não
 * pôde ser lido em texto pelo agente que escreveu este código):
 * - "Cross-simulation between two pharmacokinetic models for the
 *   target-controlled infusion of propofol" — https://ekja.org/journal/view.php?number=7311
 * - "Clinical Pharmacokinetics and Pharmacodynamics of Propofol" (PMC) —
 *   https://pmc.ncbi.nlm.nih.gov/articles/PMC6267518/
 * Antes de usar estes números fora de um contexto educacional, confira-os
 * diretamente nos artigos originais.
 *
 * IMPORTANTE: mesmo sendo um modelo clínico publicado, esta continua
 * sendo uma simulação educacional. O modelo de Schnider é conhecido por
 * se comportar de forma pouco fisiológica em pacientes com covariáveis
 * (peso/altura/idade) muito fora da faixa adulta típica — não representa
 * um dispositivo médico e não deve orientar decisões clínicas reais.
 */

export type PatientSex = 'male' | 'female';

export interface PatientParams {
  ageYears: number;
  weightKg: number;
  heightCm: number;
  sex: PatientSex;
}

export const DEFAULT_PATIENT: PatientParams = {
  ageYears: 40,
  weightKg: 70,
  heightCm: 170,
  sex: 'male',
};

/** Constante de equilíbrio do local de efeito (Schnider 1999), min⁻¹ */
export const SCHNIDER_KE0 = 0.456;

/**
 * Ganho proporcional do controlador da bomba (não faz parte do modelo
 * farmacocinético de Schnider — é a lógica própria deste simulador que
 * decide a vazão para perseguir o alvo, como um algoritmo de TCI faria).
 */
export const TCI_CONTROLLER_GAIN = 1.5; // 1/min

export interface PkConstants {
  /** Volume do compartimento central (mL) */
  v1Ml: number;
  /** Volume do compartimento periférico rápido (mL) */
  v2Ml: number;
  /** Volume do compartimento periférico lento (mL) */
  v3Ml: number;
  /** Constante de eliminação central (1/min) */
  k10: number;
  /** Constante de transferência central -> periférico rápido (1/min) */
  k12: number;
  /** Constante de transferência central -> periférico lento (1/min) */
  k13: number;
  /** Constante de transferência periférico rápido -> central (1/min) */
  k21: number;
  /** Constante de transferência periférico lento -> central (1/min) */
  k31: number;
  /** Constante de equilíbrio do local de efeito (1/min) */
  ke0: number;
}

/** Massa magra pelo método de James, usada por Schnider como covariável de Cl1. */
export function leanBodyMass(patient: PatientParams): number {
  const { weightKg: w, heightCm: h, sex } = patient;
  return sex === 'male'
    ? 1.1 * w - 128 * (w / h) ** 2
    : 1.07 * w - 148 * (w / h) ** 2;
}

/**
 * Deriva as constantes do modelo de Schnider para um paciente virtual.
 * Clareamentos são limitados a um piso positivo pequeno: para covariáveis
 * muito extremas (fora da faixa adulta típica) a fórmula publicada pode
 * produzir valores não fisiológicos (clareamento negativo) — limitação
 * conhecida do modelo, não um comportamento real do fármaco.
 */
export function computeSchniderConstants(patient: PatientParams): PkConstants {
  const { ageYears: age, weightKg: weight, heightCm: height } = patient;
  const lbm = leanBodyMass(patient);

  const v1L = 4.27;
  const v2L = Math.max(1, 18.9 - 0.391 * (age - 53));
  const v3L = 238;

  const cl1 = Math.max(
    0.1,
    1.89 + 0.0456 * (weight - 77) - 0.0681 * (lbm - 59) + 0.0264 * (height - 177),
  );
  const cl2 = Math.max(0.1, 1.29 - 0.024 * (age - 53));
  const cl3 = 0.836;

  return {
    v1Ml: v1L * 1000,
    v2Ml: v2L * 1000,
    v3Ml: v3L * 1000,
    k10: cl1 / v1L,
    k12: cl2 / v1L,
    k13: cl3 / v1L,
    k21: cl2 / v2L,
    k31: cl3 / v3L,
    ke0: SCHNIDER_KE0,
  };
}

export interface PkState {
  /** Massa no compartimento central (µg) */
  a1: number;
  /** Massa no compartimento periférico rápido (µg) */
  a2: number;
  /** Massa no compartimento periférico lento (µg) */
  a3: number;
  /** Concentração plasmática estimada, Cp = a1 / V1 (µg/mL) */
  cp: number;
  /** Concentração no local de efeito estimada (µg/mL) */
  ce: number;
}

export const INITIAL_PK_STATE: PkState = { a1: 0, a2: 0, a3: 0, cp: 0, ce: 0 };

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
  constants: PkConstants;
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
 * Nunca retorna vazão negativa: um alvo abaixo de Cp apenas interrompe a
 * infusão (a concentração cai por redistribuição/eliminação do modelo PK,
 * não por "sucção" ativa da bomba).
 */
export function computeRequiredFlowRate(
  state: Pick<PkState, 'a1' | 'a2' | 'a3'>,
  target: number,
  maxFlowRateMlH: number,
  drugConcentrationMgMl: number,
  constants: PkConstants,
): number {
  const { v1Ml, k10, k12, k13, k21, k31 } = constants;
  const { a1, a2, a3 } = state;
  const cp = a1 / v1Ml;

  // Corte rígido: se o alvo está abaixo de Cp, a bomba para imediatamente
  // (nunca "suga" fármaco de volta). Isso precisa ser checado ANTES de somar
  // o termo de manutenção abaixo, senão esse termo (que existe para manter
  // Cp estável quando target === cp) dominaria e manteria uma vazão positiva
  // mesmo com o alvo levemente abaixo da concentração atual.
  if (target <= 0 || target < cp) return 0;

  const desiredDCpDt = TCI_CONTROLLER_GAIN * (target - cp); // >= 0 aqui
  const desiredDA1Dt = desiredDCpDt * v1Ml; // µg/min
  const requiredInputRateUgMin =
    desiredDA1Dt + (k10 + k12 + k13) * a1 - k21 * a2 - k31 * a3;

  if (requiredInputRateUgMin <= 0) return 0;

  // µg/min -> mg/min -> mL/min -> mL/h
  const flowMlPerMin = requiredInputRateUgMin / 1000 / drugConcentrationMgMl;
  const flowMlPerH = flowMlPerMin * 60;

  return clamp(flowMlPerH, 0, maxFlowRateMlH);
}

export function stepPk(input: PkStepInput): PkStepResult {
  const { v1Ml, k10, k12, k13, k21, k31, ke0 } = input.constants;
  const { a1, a2, a3, ce } = input.state;
  const cp = a1 / v1Ml;
  const dtMin = input.dtSeconds / 60;

  let flowRateMlH = 0;
  if (input.infusing && input.syringeRemainingMl > 0) {
    flowRateMlH = computeRequiredFlowRate(
      input.state,
      input.target,
      input.maxFlowRateMlH,
      input.drugConcentrationMgMl,
      input.constants,
    );
    const maxFlowFromSyringe =
      (input.syringeRemainingMl / Math.max(input.dtSeconds, 0.001)) * 3600;
    flowRateMlH = Math.min(flowRateMlH, maxFlowFromSyringe);
  }

  // mL/h -> µg/min
  const inputRateUgMin = (flowRateMlH / 60) * input.drugConcentrationMgMl * 1000;

  const dA1Dt = inputRateUgMin - (k10 + k12 + k13) * a1 + k21 * a2 + k31 * a3;
  const dA2Dt = k12 * a1 - k21 * a2;
  const dA3Dt = k13 * a1 - k31 * a3;
  const dCeDt = ke0 * (cp - ce);

  const nextA1 = Math.max(0, a1 + dA1Dt * dtMin);
  const nextA2 = Math.max(0, a2 + dA2Dt * dtMin);
  const nextA3 = Math.max(0, a3 + dA3Dt * dtMin);
  const nextCe = Math.max(0, ce + dCeDt * dtMin);
  const nextCp = nextA1 / v1Ml;

  const volumeDeltaMl = flowRateMlH * (input.dtSeconds / 3600);

  return {
    state: { a1: nextA1, a2: nextA2, a3: nextA3, cp: nextCp, ce: nextCe },
    flowRateMlH,
    volumeDeltaMl,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

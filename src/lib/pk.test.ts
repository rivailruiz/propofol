import { describe, expect, it } from 'vitest';
import {
  computeMarshConstants,
  computePkConstants,
  computeRequiredFlowRate,
  computeSchniderConstants,
  leanBodyMass,
  stepPk,
  DEFAULT_PATIENT,
  INITIAL_PK_STATE,
  type PatientParams,
  type PkState,
} from './pk';

const CONSTANTS = computeSchniderConstants(DEFAULT_PATIENT);

describe('leanBodyMass (James formula)', () => {
  it('matches the hand-checked value for a 70kg/170cm male', () => {
    expect(leanBodyMass({ ageYears: 40, weightKg: 70, heightCm: 170, sex: 'male' })).toBeCloseTo(
      55.2976,
      3,
    );
  });

  it('matches the hand-checked value for a 60kg/160cm female', () => {
    expect(
      leanBodyMass({ ageYears: 40, weightKg: 60, heightCm: 160, sex: 'female' }),
    ).toBeCloseTo(43.3875, 3);
  });
});

describe('computeSchniderConstants', () => {
  it('reproduces the published Schnider (1998/1999) coefficients for a reference adult', () => {
    // Paciente de referência: 40 anos, 70 kg, 170 cm, masculino.
    const c = computeSchniderConstants({ ageYears: 40, weightKg: 70, heightCm: 170, sex: 'male' });
    expect(c.v1Ml).toBe(4270); // V1 = 4.27 L, fixo
    expect(c.v2Ml).toBeCloseTo(23983, 0); // V2 = 18.9 - 0.391*(idade-53)
    expect(c.v3Ml).toBe(238000); // V3 = 238 L, fixo
    expect(c.k10).toBeCloseTo(0.38364, 4);
    expect(c.k12).toBeCloseTo(0.37518, 4);
    expect(c.k13).toBeCloseTo(0.19578, 4);
    expect(c.k21).toBeCloseTo(0.0668, 4);
    expect(c.k31).toBeCloseTo(0.0035126, 6);
    expect(c.ke0).toBe(0.459); // Barakat et al. 2007, citando Schnider 1999
  });

  it('increases V2 and Cl2 for patients younger than 53 (age covariate)', () => {
    const younger = computeSchniderConstants({ ageYears: 30, weightKg: 70, heightCm: 170, sex: 'male' });
    const older = computeSchniderConstants({ ageYears: 70, weightKg: 70, heightCm: 170, sex: 'male' });
    expect(younger.v2Ml).toBeGreaterThan(older.v2Ml);
    expect(younger.k21).toBeLessThan(older.k21); // Cl2/V2: V2 menor domina, k21 sobe com a idade
  });

  it('increases central elimination (k10) with higher body weight', () => {
    const lighter = computeSchniderConstants({ ageYears: 40, weightKg: 55, heightCm: 170, sex: 'male' });
    const heavier = computeSchniderConstants({ ageYears: 40, weightKg: 95, heightCm: 170, sex: 'male' });
    expect(heavier.k10).toBeGreaterThan(lighter.k10);
  });

  it('never produces a non-positive clearance for extreme covariates (known model limitation, clamped)', () => {
    const extreme: PatientParams = { ageYears: 95, weightKg: 30, heightCm: 220, sex: 'female' };
    const c = computeSchniderConstants(extreme);
    expect(c.k10).toBeGreaterThan(0);
    expect(c.k12).toBeGreaterThan(0);
    expect(c.k21).toBeGreaterThan(0);
  });
});

describe('computeMarshConstants', () => {
  it('reproduces the published Marsh (1991) coefficients for a 70kg patient', () => {
    // Fonte: Marsh et al. Br J Anaesth 1991;67:41-48 (V1/V2/V3 proporcionais
    // ao peso; k10–k31 fixos, independentes de idade/altura/sexo).
    const c = computeMarshConstants({ ageYears: 40, weightKg: 70, heightCm: 170, sex: 'male' });
    expect(c.v1Ml).toBeCloseTo(0.228 * 70 * 1000, 6); // V1 = 0.228 L/kg
    expect(c.v2Ml).toBeCloseTo(0.464 * 70 * 1000, 6); // V2 = 0.464 L/kg
    expect(c.v3Ml).toBeCloseTo(2.89 * 70 * 1000, 6); // V3 = 2.89 L/kg
    expect(c.k10).toBe(0.119);
    expect(c.k12).toBe(0.112);
    expect(c.k13).toBe(0.042);
    expect(c.k21).toBe(0.055);
    expect(c.k31).toBe(0.0033);
    expect(c.ke0).toBe(0.26); // Barakat et al. 2007, citando Marsh 1991
  });

  it('scales every volume proportionally with weight, unlike Schnider', () => {
    const light = computeMarshConstants({ ageYears: 40, weightKg: 50, heightCm: 170, sex: 'male' });
    const heavy = computeMarshConstants({ ageYears: 40, weightKg: 100, heightCm: 170, sex: 'male' });
    expect(heavy.v1Ml).toBeCloseTo(light.v1Ml * 2, 6);
    // As constantes de taxa não dependem do peso (só os volumes escalam).
    expect(heavy.k10).toBe(light.k10);
  });

  it('ignores age, height and sex entirely (only weight matters)', () => {
    const a = computeMarshConstants({ ageYears: 25, weightKg: 70, heightCm: 150, sex: 'female' });
    const b = computeMarshConstants({ ageYears: 80, weightKg: 70, heightCm: 210, sex: 'male' });
    expect(a).toEqual(b);
  });
});

describe('computePkConstants', () => {
  it('routes to the Marsh or Schnider implementation based on the model argument', () => {
    const marsh = computePkConstants('marsh', DEFAULT_PATIENT);
    const schnider = computePkConstants('schnider', DEFAULT_PATIENT);
    expect(marsh).toEqual(computeMarshConstants(DEFAULT_PATIENT));
    expect(schnider).toEqual(computeSchniderConstants(DEFAULT_PATIENT));
    expect(marsh.ke0).not.toBe(schnider.ke0);
  });
});

describe('computeRequiredFlowRate', () => {
  it('returns 0 when the target is below the current plasma concentration (pump does not pull concentration down)', () => {
    const state: PkState = { a1: CONSTANTS.v1Ml * 3, a2: 1000, a3: 1000, cp: 3, ce: 2 };
    expect(computeRequiredFlowRate(state, 2, 1200, 10, CONSTANTS)).toBe(0);
  });

  it('still returns a maintenance flow rate when the target equals Cp (counteracts elimination)', () => {
    const state: PkState = { a1: CONSTANTS.v1Ml * 3, a2: 1000, a3: 1000, cp: 3, ce: 2 };
    expect(computeRequiredFlowRate(state, 3, 1200, 10, CONSTANTS)).toBeGreaterThan(0);
  });

  it('returns a positive flow rate when the target is above the current plasma concentration', () => {
    const rate = computeRequiredFlowRate(INITIAL_PK_STATE, 2, 1200, 10, CONSTANTS);
    expect(rate).toBeGreaterThan(0);
  });

  it('clamps the flow rate to the pump maximum', () => {
    const rate = computeRequiredFlowRate(INITIAL_PK_STATE, 8, 50, 10, CONSTANTS);
    expect(rate).toBe(50);
  });
});

describe('stepPk', () => {
  it('increases plasma concentration toward the target while infusing', () => {
    const result = stepPk({
      state: INITIAL_PK_STATE,
      target: 2,
      dtSeconds: 1,
      drugConcentrationMgMl: 10,
      maxFlowRateMlH: 1200,
      syringeRemainingMl: 50,
      infusing: true,
      constants: CONSTANTS,
    });
    expect(result.flowRateMlH).toBeGreaterThan(0);
    expect(result.state.cp).toBeGreaterThan(0);
    expect(result.volumeDeltaMl).toBeGreaterThan(0);
    // Cp = a1 / V1 deve estar sempre consistente com a massa central.
    expect(result.state.cp).toBeCloseTo(result.state.a1 / CONSTANTS.v1Ml, 9);
  });

  it('does not add drug when not infusing, and lets Cp decay', () => {
    const startState: PkState = { a1: CONSTANTS.v1Ml * 3, a2: 5000, a3: 5000, cp: 3, ce: 2 };
    const result = stepPk({
      state: startState,
      target: 2,
      dtSeconds: 1,
      drugConcentrationMgMl: 10,
      maxFlowRateMlH: 1200,
      syringeRemainingMl: 50,
      infusing: false,
      constants: CONSTANTS,
    });
    expect(result.flowRateMlH).toBe(0);
    expect(result.volumeDeltaMl).toBe(0);
    expect(result.state.cp).toBeLessThan(startState.cp);
  });

  it('does not infuse a negative amount when the target is below Cp (pump just stops)', () => {
    const startState: PkState = { a1: CONSTANTS.v1Ml * 5, a2: 5000, a3: 5000, cp: 5, ce: 3 };
    const result = stepPk({
      state: startState,
      target: 1,
      dtSeconds: 1,
      drugConcentrationMgMl: 10,
      maxFlowRateMlH: 1200,
      syringeRemainingMl: 50,
      infusing: true,
      constants: CONSTANTS,
    });
    expect(result.flowRateMlH).toBe(0);
    expect(result.state.cp).toBeLessThan(startState.cp);
  });

  it('never draws more volume than remains in the syringe', () => {
    const result = stepPk({
      state: INITIAL_PK_STATE,
      target: 8,
      dtSeconds: 3600, // 1h de janela para forçar uma demanda grande
      drugConcentrationMgMl: 10,
      maxFlowRateMlH: 1200,
      syringeRemainingMl: 5,
      infusing: true,
      constants: CONSTANTS,
    });
    expect(result.volumeDeltaMl).toBeLessThanOrEqual(5 + 1e-6);
  });

  it('makes the effect-site concentration lag behind plasma concentration while rising', () => {
    let state: PkState = INITIAL_PK_STATE;
    for (let i = 0; i < 30; i++) {
      const result = stepPk({
        state,
        target: 4,
        dtSeconds: 1,
        drugConcentrationMgMl: 10,
        maxFlowRateMlH: 1200,
        syringeRemainingMl: 50,
        infusing: true,
        constants: CONSTANTS,
      });
      state = result.state;
    }
    expect(state.ce).toBeLessThan(state.cp);
    expect(state.ce).toBeGreaterThan(0);
  });

  it('conserves mass: amount infused equals amount across compartments plus amount eliminated', () => {
    let state: PkState = INITIAL_PK_STATE;
    let totalInfusedUg = 0;
    const dtSeconds = 1;
    for (let i = 0; i < 60; i++) {
      const result = stepPk({
        state,
        target: 3,
        dtSeconds,
        drugConcentrationMgMl: 10,
        maxFlowRateMlH: 1200,
        syringeRemainingMl: 50,
        infusing: true,
        constants: CONSTANTS,
      });
      totalInfusedUg += (result.flowRateMlH / 3600) * dtSeconds * 10 * 1000; // mL * mg/mL * 1000 = µg
      state = result.state;
    }
    const remainingInCompartments = state.a1 + state.a2 + state.a3;
    expect(remainingInCompartments).toBeLessThanOrEqual(totalInfusedUg + 1e-6);
    expect(remainingInCompartments).toBeGreaterThan(totalInfusedUg * 0.5); // pouco tempo decorrido, pouca eliminação
  });
});

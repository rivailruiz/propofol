import { describe, expect, it } from 'vitest';
import { computeRequiredFlowRate, stepPk, DEFAULT_PK_CONSTANTS, type PkState } from './pk';

const ZERO_STATE: PkState = { cp: 0, cp2: 0, ce: 0 };

describe('computeRequiredFlowRate', () => {
  it('returns 0 when the target is below the current plasma concentration (pump does not pull concentration down)', () => {
    const state: PkState = { cp: 3, cp2: 1, ce: 2 };
    expect(computeRequiredFlowRate(state, 2, 1200, 10, DEFAULT_PK_CONSTANTS)).toBe(0);
  });

  it('still returns a maintenance flow rate when the target equals Cp (counteracts elimination)', () => {
    const state: PkState = { cp: 3, cp2: 1, ce: 2 };
    expect(computeRequiredFlowRate(state, 3, 1200, 10, DEFAULT_PK_CONSTANTS)).toBeGreaterThan(0);
  });

  it('returns a positive flow rate when the target is above the current plasma concentration', () => {
    const rate = computeRequiredFlowRate(ZERO_STATE, 2, 1200, 10, DEFAULT_PK_CONSTANTS);
    expect(rate).toBeGreaterThan(0);
  });

  it('clamps the flow rate to the pump maximum', () => {
    const rate = computeRequiredFlowRate(ZERO_STATE, 8, 50, 10, DEFAULT_PK_CONSTANTS);
    expect(rate).toBe(50);
  });
});

describe('stepPk', () => {
  it('increases plasma concentration toward the target while infusing', () => {
    const result = stepPk({
      state: ZERO_STATE,
      target: 2,
      dtSeconds: 1,
      drugConcentrationMgMl: 10,
      maxFlowRateMlH: 1200,
      syringeRemainingMl: 50,
      infusing: true,
    });
    expect(result.flowRateMlH).toBeGreaterThan(0);
    expect(result.state.cp).toBeGreaterThan(0);
    expect(result.volumeDeltaMl).toBeGreaterThan(0);
  });

  it('does not add drug when not infusing, and lets Cp decay', () => {
    const startState: PkState = { cp: 3, cp2: 1, ce: 2 };
    const result = stepPk({
      state: startState,
      target: 2,
      dtSeconds: 1,
      drugConcentrationMgMl: 10,
      maxFlowRateMlH: 1200,
      syringeRemainingMl: 50,
      infusing: false,
    });
    expect(result.flowRateMlH).toBe(0);
    expect(result.volumeDeltaMl).toBe(0);
    expect(result.state.cp).toBeLessThan(startState.cp);
  });

  it('does not infuse a negative amount when the target is below Cp (pump just stops)', () => {
    const startState: PkState = { cp: 5, cp2: 1, ce: 3 };
    const result = stepPk({
      state: startState,
      target: 1,
      dtSeconds: 1,
      drugConcentrationMgMl: 10,
      maxFlowRateMlH: 1200,
      syringeRemainingMl: 50,
      infusing: true,
    });
    expect(result.flowRateMlH).toBe(0);
    expect(result.state.cp).toBeLessThan(startState.cp);
  });

  it('never draws more volume than remains in the syringe', () => {
    const result = stepPk({
      state: ZERO_STATE,
      target: 8,
      dtSeconds: 3600, // 1h window to force a large demand
      drugConcentrationMgMl: 10,
      maxFlowRateMlH: 1200,
      syringeRemainingMl: 5,
      infusing: true,
    });
    expect(result.volumeDeltaMl).toBeLessThanOrEqual(5 + 1e-6);
  });

  it('makes the effect-site concentration lag behind plasma concentration while rising', () => {
    let state: PkState = ZERO_STATE;
    for (let i = 0; i < 30; i++) {
      const result = stepPk({
        state,
        target: 4,
        dtSeconds: 1,
        drugConcentrationMgMl: 10,
        maxFlowRateMlH: 1200,
        syringeRemainingMl: 50,
        infusing: true,
      });
      state = result.state;
    }
    expect(state.ce).toBeLessThan(state.cp);
    expect(state.ce).toBeGreaterThan(0);
  });
});

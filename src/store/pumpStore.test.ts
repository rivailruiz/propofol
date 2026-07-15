import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePumpStore, DEFAULT_CONFIG } from './pumpStore';

function resetStore() {
  const current = usePumpStore.getState();
  if (current._intervalId !== null) clearInterval(current._intervalId);
  usePumpStore.setState({
    config: DEFAULT_CONFIG,
    status: 'stopped',
    target: 2.0,
    pk: { cp: 0, cp2: 0, ce: 0 },
    flowRateMlH: 0,
    infusedVolumeMl: 0,
    elapsedSeconds: 0,
    syringeRemainingMl: DEFAULT_CONFIG.syringeVolumeMax,
    batteryPercent: 87,
    history: [{ t: 0, cpt: 2.0, cp: 0, ce: 0 }],
    alarms: [],
    isSettingsOpen: false,
    isAlarmPanelOpen: false,
    isKeypadOpen: false,
    _intervalId: null,
  });
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  const current = usePumpStore.getState();
  if (current._intervalId !== null) clearInterval(current._intervalId);
  vi.useRealTimers();
});

describe('target controls', () => {
  it('increments and decrements the target by the configured step', () => {
    usePumpStore.getState().incrementTarget();
    expect(usePumpStore.getState().target).toBeCloseTo(2.1);
    usePumpStore.getState().decrementTarget();
    usePumpStore.getState().decrementTarget();
    expect(usePumpStore.getState().target).toBeCloseTo(1.9);
  });

  it('clamps the target to the configured min/max', () => {
    usePumpStore.getState().setTarget(999);
    expect(usePumpStore.getState().target).toBe(DEFAULT_CONFIG.targetMax);
    usePumpStore.getState().setTarget(-5);
    expect(usePumpStore.getState().target).toBe(DEFAULT_CONFIG.targetMin);
  });
});

describe('lifecycle', () => {
  it('starts stopped and transitions to running on start()', () => {
    expect(usePumpStore.getState().status).toBe('stopped');
    usePumpStore.getState().start();
    expect(usePumpStore.getState().status).toBe('running');
  });

  it('advances elapsed time and concentrations on tick() while running', () => {
    usePumpStore.setState({ status: 'running', target: 3 });
    usePumpStore.getState().tick();
    usePumpStore.getState().tick();
    const state = usePumpStore.getState();
    expect(state.elapsedSeconds).toBe(2);
    expect(state.pk.cp).toBeGreaterThan(0);
    expect(state.infusedVolumeMl).toBeGreaterThan(0);
    expect(state.history.length).toBeGreaterThan(1);
  });

  it('pauses and zeroes the flow rate, but keeps elapsed time frozen', () => {
    usePumpStore.setState({ status: 'running', target: 3 });
    usePumpStore.getState().tick();
    usePumpStore.getState().pause();
    const afterPause = usePumpStore.getState();
    expect(afterPause.status).toBe('paused');
    expect(afterPause.flowRateMlH).toBe(0);

    const elapsedBefore = afterPause.elapsedSeconds;
    usePumpStore.getState().tick();
    expect(usePumpStore.getState().elapsedSeconds).toBe(elapsedBefore);
  });

  it('resumes from paused back to running', () => {
    usePumpStore.setState({ status: 'paused' });
    usePumpStore.getState().resume();
    expect(usePumpStore.getState().status).toBe('running');
  });

  it('resets all session values on stop()', () => {
    usePumpStore.setState({
      status: 'running',
      elapsedSeconds: 120,
      infusedVolumeMl: 40,
      pk: { cp: 3, cp2: 1, ce: 2 },
    });
    usePumpStore.getState().stop();
    const state = usePumpStore.getState();
    expect(state.status).toBe('stopped');
    expect(state.elapsedSeconds).toBe(0);
    expect(state.infusedVolumeMl).toBe(0);
    expect(state.pk).toEqual({ cp: 0, cp2: 0, ce: 0 });
    expect(state.syringeRemainingMl).toBe(DEFAULT_CONFIG.syringeVolumeMax);
  });
});

describe('alarms', () => {
  it('triggers a critical alarm and pauses a running infusion', () => {
    usePumpStore.setState({ status: 'running' });
    usePumpStore.getState().triggerAlarm('occlusion');
    const state = usePumpStore.getState();
    expect(state.alarms).toHaveLength(1);
    expect(state.status).toBe('paused');
  });

  it('prevents start() while a critical alarm is active', () => {
    usePumpStore.getState().triggerAlarm('air_in_line');
    usePumpStore.getState().start();
    expect(usePumpStore.getState().status).toBe('stopped');
  });

  it('clears an individual alarm by id', () => {
    usePumpStore.getState().triggerAlarm('low_battery');
    const id = usePumpStore.getState().alarms[0].id;
    usePumpStore.getState().clearAlarm(id);
    expect(usePumpStore.getState().alarms).toHaveLength(0);
  });

  it('automatically raises a syringe_empty alarm once the syringe is depleted', () => {
    usePumpStore.setState({
      status: 'running',
      target: 8,
      syringeRemainingMl: 0.0001,
    });
    usePumpStore.getState().tick();
    const state = usePumpStore.getState();
    expect(state.syringeRemainingMl).toBe(0);
    expect(state.alarms.some((a) => a.type === 'syringe_empty')).toBe(true);
  });
});

describe('start/pause interval wiring', () => {
  it('schedules a recurring tick while running and clears it on stop', () => {
    vi.useFakeTimers();
    usePumpStore.getState().start();
    usePumpStore.setState({ target: 4 });
    vi.advanceTimersByTime(3000);
    expect(usePumpStore.getState().elapsedSeconds).toBe(3);

    usePumpStore.getState().stop();
    vi.advanceTimersByTime(3000);
    expect(usePumpStore.getState().elapsedSeconds).toBe(0);
  });
});

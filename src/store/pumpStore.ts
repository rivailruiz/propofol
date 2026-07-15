import { create } from 'zustand';
import { stepPk, clamp, DEFAULT_PK_CONSTANTS, type PkState } from '../lib/pk';
import { ALARM_DEFINITIONS, type ActiveAlarm, type AlarmType } from '../lib/alarms';

export type PumpStatus = 'stopped' | 'running' | 'paused';

export interface HistoryPoint {
  t: number; // segundos desde o início da sessão
  cpt: number;
  cp: number;
  ce: number;
}

export const HISTORY_WINDOW_SECONDS = 5 * 60;
export const TICK_MS = 1000;

interface Config {
  drugName: string;
  drugConcentrationMgMl: number; // mg/mL (ex.: 10 = 1%)
  targetMin: number;
  targetMax: number;
  targetStep: number;
  syringeVolumeMax: number; // mL
  maxFlowRateMlH: number; // mL/h
}

interface PumpState {
  config: Config;
  status: PumpStatus;
  target: number; // Cpt µg/mL
  pk: PkState;
  flowRateMlH: number;
  infusedVolumeMl: number;
  elapsedSeconds: number;
  syringeRemainingMl: number;
  batteryPercent: number;
  history: HistoryPoint[];
  alarms: ActiveAlarm[];
  isSettingsOpen: boolean;
  isAlarmPanelOpen: boolean;
  isKeypadOpen: boolean;

  _intervalId: ReturnType<typeof setInterval> | null;

  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setTarget: (value: number) => void;
  incrementTarget: () => void;
  decrementTarget: () => void;
  setConfig: (partial: Partial<Config>) => void;
  tick: () => void;
  triggerAlarm: (type: AlarmType) => void;
  clearAlarm: (id: string) => void;
  clearAllAlarms: () => void;
  toggleSettings: (open?: boolean) => void;
  toggleAlarmPanel: (open?: boolean) => void;
  toggleKeypad: (open?: boolean) => void;
}

export const DEFAULT_CONFIG: Config = {
  drugName: 'Propofol',
  drugConcentrationMgMl: 10, // 1%
  targetMin: 0.5,
  targetMax: 8,
  targetStep: 0.1,
  syringeVolumeMax: 50,
  maxFlowRateMlH: 1200,
};

const INITIAL_PK: PkState = { cp: 0, cp2: 0, ce: 0 };

function hasCriticalAlarm(alarms: ActiveAlarm[]): boolean {
  return alarms.some((a) => ALARM_DEFINITIONS[a.type].severity === 'critical');
}

export const usePumpStore = create<PumpState>((set, get) => ({
  config: DEFAULT_CONFIG,
  status: 'stopped',
  target: 2.0,
  pk: INITIAL_PK,
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

  start: () => {
    const state = get();
    if (state.status === 'running') return;
    if (hasCriticalAlarm(state.alarms)) return;

    if (state._intervalId === null) {
      const id = setInterval(() => get().tick(), TICK_MS);
      set({ _intervalId: id });
    }
    set({ status: 'running' });
  },

  pause: () => {
    if (get().status !== 'running') return;
    set({ status: 'paused', flowRateMlH: 0 });
  },

  resume: () => {
    if (get().status !== 'paused') return;
    if (hasCriticalAlarm(get().alarms)) return;
    set({ status: 'running' });
  },

  stop: () => {
    const state = get();
    if (state._intervalId !== null) {
      clearInterval(state._intervalId);
    }
    set({
      status: 'stopped',
      pk: INITIAL_PK,
      flowRateMlH: 0,
      infusedVolumeMl: 0,
      elapsedSeconds: 0,
      syringeRemainingMl: state.config.syringeVolumeMax,
      history: [{ t: 0, cpt: state.target, cp: 0, ce: 0 }],
      alarms: state.alarms.filter((a) => a.type === 'low_battery'),
      _intervalId: null,
    });
  },

  setTarget: (value) => {
    const { targetMin, targetMax } = get().config;
    set({ target: clamp(round1(value), targetMin, targetMax) });
  },

  incrementTarget: () => {
    const { target, config } = get();
    set({ target: clamp(round1(target + config.targetStep), config.targetMin, config.targetMax) });
  },

  decrementTarget: () => {
    const { target, config } = get();
    set({ target: clamp(round1(target - config.targetStep), config.targetMin, config.targetMax) });
  },

  setConfig: (partial) => {
    set((s) => ({ config: { ...s.config, ...partial } }));
  },

  tick: () => {
    const state = get();
    if (state.status !== 'running' && state.status !== 'paused') return;

    const dtSeconds = TICK_MS / 1000;
    const infusing = state.status === 'running' && !hasCriticalAlarm(state.alarms);

    const result = stepPk({
      state: state.pk,
      target: state.target,
      dtSeconds,
      drugConcentrationMgMl: state.config.drugConcentrationMgMl,
      maxFlowRateMlH: state.config.maxFlowRateMlH,
      syringeRemainingMl: state.syringeRemainingMl,
      infusing,
      constants: DEFAULT_PK_CONSTANTS,
    });

    const nextSyringeRemaining = Math.max(
      0,
      state.syringeRemainingMl - result.volumeDeltaMl,
    );
    const nextElapsed =
      state.status === 'running' ? state.elapsedSeconds + dtSeconds : state.elapsedSeconds;
    const nextVolume = state.infusedVolumeMl + result.volumeDeltaMl;

    const nextHistoryPoint: HistoryPoint = {
      t: nextElapsed,
      cpt: state.target,
      cp: result.state.cp,
      ce: result.state.ce,
    };
    const nextHistory = [...state.history, nextHistoryPoint].filter(
      (p) => nextElapsed - p.t <= HISTORY_WINDOW_SECONDS,
    );

    let nextBattery = state.batteryPercent;
    if (state.status === 'running') {
      nextBattery = Math.max(0, state.batteryPercent - 0.003);
    }

    const newAlarms: ActiveAlarm[] = [];
    if (nextSyringeRemaining <= 0 && !state.alarms.some((a) => a.type === 'syringe_empty')) {
      newAlarms.push(makeAlarm('syringe_empty'));
    }
    if (nextBattery < 15 && !state.alarms.some((a) => a.type === 'low_battery')) {
      newAlarms.push(makeAlarm('low_battery'));
    }

    set({
      pk: result.state,
      flowRateMlH: result.flowRateMlH,
      syringeRemainingMl: nextSyringeRemaining,
      elapsedSeconds: nextElapsed,
      infusedVolumeMl: nextVolume,
      history: nextHistory,
      batteryPercent: nextBattery,
      alarms: newAlarms.length ? [...state.alarms, ...newAlarms] : state.alarms,
    });
  },

  triggerAlarm: (type) => {
    const state = get();
    if (state.alarms.some((a) => a.type === type)) return;
    const alarm = makeAlarm(type);
    const shouldPause =
      ALARM_DEFINITIONS[type].severity === 'critical' && state.status === 'running';
    set({
      alarms: [...state.alarms, alarm],
      status: shouldPause ? 'paused' : state.status,
      flowRateMlH: shouldPause ? 0 : state.flowRateMlH,
    });
  },

  clearAlarm: (id) => {
    set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) }));
  },

  clearAllAlarms: () => {
    set({ alarms: [] });
  },

  toggleSettings: (open) => {
    set((s) => ({ isSettingsOpen: open ?? !s.isSettingsOpen }));
  },

  toggleAlarmPanel: (open) => {
    set((s) => ({ isAlarmPanelOpen: open ?? !s.isAlarmPanelOpen }));
  },

  toggleKeypad: (open) => {
    set((s) => ({ isKeypadOpen: open ?? !s.isKeypadOpen }));
  },
}));

function makeAlarm(type: AlarmType): ActiveAlarm {
  return { id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, triggeredAt: Date.now(), type };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

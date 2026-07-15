import { OrientationGuard } from './components/OrientationGuard';
import { TopBar } from './components/TopBar';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { BottomBar } from './components/BottomBar';
import { NumericKeypad } from './components/NumericKeypad';
import { AlarmPanel } from './components/AlarmPanel';
import { SettingsModal } from './components/SettingsModal';

function App() {
  return (
    <>
      <OrientationGuard />
      <div className="app-shell safe-left safe-right h-[100dvh] w-[100dvw] flex-col overflow-hidden bg-chassis-950">
        <TopBar />
        <main className="flex min-h-0 flex-1 overflow-hidden">
          <div className="w-[38%] min-w-[220px] max-w-[340px]">
            <LeftPanel />
          </div>
          <div className="min-w-0 flex-1">
            <RightPanel />
          </div>
        </main>
        <BottomBar />
      </div>

      <NumericKeypad />
      <AlarmPanel />
      <SettingsModal />
    </>
  );
}

export default App;

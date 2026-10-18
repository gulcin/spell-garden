import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type LiveReport = {
  screen: string;
  placeId: string;
  placeName: string;
  activity: string;
  question: string;
  lastAnswer: string;
};

const EMPTY: LiveReport = {
  screen: 'home',
  placeId: '',
  placeName: '',
  activity: '',
  question: '',
  lastAnswer: '',
};

const LiveContext = createContext<{ live: LiveReport; setLive: (patch: Partial<LiveReport>) => void }>({
  live: EMPTY,
  setLive: () => undefined,
});

export function ReportLiveProvider({ children }: { children: ReactNode }) {
  const [live, setLiveState] = useState<LiveReport>(EMPTY);
  const setLive = useCallback((patch: Partial<LiveReport>) => {
    setLiveState((current) => ({ ...current, ...patch }));
  }, []);
  const value = useMemo(() => ({ live, setLive }), [live, setLive]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useReportLive(): { live: LiveReport; setLive: (patch: Partial<LiveReport>) => void } {
  return useContext(LiveContext);
}

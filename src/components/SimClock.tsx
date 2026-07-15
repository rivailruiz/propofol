import { useEffect, useState } from 'react';
import { formatClock } from '../lib/format';

export function SimClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  return <span className="tabular text-sm font-medium text-gray-300">{formatClock(now)}</span>;
}

import { useState, useEffect } from 'react';

export function useFeatureFlag(flagKey: string, initialValue: boolean = false) {
  const [enabled, setEnabled] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Client-side feature flag consumer hook
    setLoading(false);
  }, [flagKey]);

  return { enabled, loading };
}

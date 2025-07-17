// mobile/src/hooks/useAsyncAction.ts
import { useState, useCallback } from "react";

export default function useAsyncAction<
  T extends (...args: any[]) => Promise<any>,
>(asyncFn: T, onError?: (e: Error) => void) {
  const [loading, setLoading] = useState(false);
  const run = useCallback(
    async (...args: Parameters<T>) => {
      setLoading(true);
      try {
        await asyncFn(...args);
      } catch (err: any) {
        onError?.(err);
      } finally {
        setLoading(false);
      }
    },
    [asyncFn, onError]
  );
  return [run, { loading }] as const;
}

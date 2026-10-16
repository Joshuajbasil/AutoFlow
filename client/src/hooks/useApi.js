import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';

export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState(previous => ({ ...previous, loading: true, error: '' }));
    api.get(path, { signal: controller.signal }).then(({ data }) => setState({ data, loading: false, error: '' })).catch(error => {
      if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: errorMessage(error) }));
    });
    return () => controller.abort();
  }, [path, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { ...state, reload };
}

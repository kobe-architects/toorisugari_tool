import { useLocation } from 'react-router-dom';

/** react-router の location.state を型付きで取り出す（無ければ null）。 */
export function useLocationState<T>(): T | null {
  const loc = useLocation();
  return (loc.state as T | null) ?? null;
}

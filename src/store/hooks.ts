import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed wrappers around the raw Redux hooks.
 * Components should import these instead of the raw hooks
 * to get correct TypeScript inference on state and dispatch.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

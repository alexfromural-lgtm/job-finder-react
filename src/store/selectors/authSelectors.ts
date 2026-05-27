import type { RootState } from '../store';
import type { Role } from '../../types';

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
export const selectAuthError = (state: RootState) => state.auth.error;

/**
 * Factory selector — returns a stable boolean for whether the current user
 * has the given role.
 *
 * Usage: `useAppSelector(selectHasRole('JOB_SEEKER'))`
 */
export const selectHasRole = (role: Role) => (state: RootState) =>
  state.auth.user?.roles.includes(role) ?? false;

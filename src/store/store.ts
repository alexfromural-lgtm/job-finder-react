import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobSearchReducer from './slices/jobSearchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobSearch: jobSearchReducer,
  },
});

// Explicitly declare RootState from each reducer's return type.
// Avoids inference breakage under verbatimModuleSyntax + TS 5.8 where
// ReturnType<typeof store.getState> can silently degrade slice types to unknown.
export type RootState = {
  auth: ReturnType<typeof authReducer>;
  jobSearch: ReturnType<typeof jobSearchReducer>;
};
export type AppDispatch = typeof store.dispatch;

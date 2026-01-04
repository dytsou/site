import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import githubReducer from './githubSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    github: githubReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


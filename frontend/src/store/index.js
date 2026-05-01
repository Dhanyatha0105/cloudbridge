import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import migrationReducer from './slices/migrationSlice';
import carbonReducer from './slices/carbonSlice';
import infrastructureReducer from './slices/infrastructureSlice';
import integrationReducer from './slices/integrationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    migration: migrationReducer,
    carbon: carbonReducer,
    infrastructure: infrastructureReducer,
    integration: integrationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

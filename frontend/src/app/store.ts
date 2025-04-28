import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import robotReducer from '../features/robot/robotSlice';
// Use sessionStorage so data clears on browser restart
import sessionStorage from 'redux-persist/lib/storage/session';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: sessionStorage,
  whitelist: ['robot'], // only robot slice will be persisted
};

// Combine reducers
const rootReducer = combineReducers({
  robot: robotReducer,
});

// Enhance reducer with persistence capabilities
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer and ignore redux-persist actions in serializability check
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
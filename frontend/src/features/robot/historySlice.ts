import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import type { RootState } from '../../app/store';

// Represents a single entry in robot history
export interface RobotHistoryEntry {
  id: string;
  robot: { id: string };
  x: number;
  y: number;
  facing: string;
  timestamp: string;
}

interface HistoryState {
  list: RobotHistoryEntry[];
}

const initialState: HistoryState = {
  list: [],
};

// Async thunk to fetch history entries for a specific robot by ID
export const fetchHistory = createAsyncThunk<
  RobotHistoryEntry[],
  string
>(
  'history/fetch',
  async (robotId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/history/${robotId}`);
      return response.data as RobotHistoryEntry[];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return rejectWithValue(message);
    }
  }
);

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.fulfilled, (state, action: PayloadAction<RobotHistoryEntry[]>) => {
        state.list = action.payload;
      });
  },
});
export default historySlice.reducer;
// Selector for history stored in the robot slice
export const selectHistory = (state: RootState) => state.robot.history; 
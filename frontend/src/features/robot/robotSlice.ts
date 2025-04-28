import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import { isAxiosError } from 'axios';
import type { RootState } from '../../app/store';
import { fetchHistory, RobotHistoryEntry as ServerHistoryEntry } from './historySlice';

// Robot entity interface
export interface Robot {
  id: string;
  x: number;
  y: number;
  facing: string;
  maxX?: number;
  maxY?: number;
}

// Local history entry (only stores coordinates and facing)
export interface LocalHistoryEntry {
  x: number;
  y: number;
  facing: string;
}

interface RobotState {
  current: Robot | null;
  history: LocalHistoryEntry[];
}

const initialState: RobotState = {
  current: null,
  history: [],
};

// Async thunks
export const placeRobot = createAsyncThunk<Robot, { x: number; y: number; maxX?: number; maxY?: number }>(
  'robot/place',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/place', payload);
      return response.data as Robot;
    } catch (err: unknown) {
      let message: string;
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        message = data?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      return rejectWithValue(message);
    }
  }
);

export const fetchReport = createAsyncThunk<Robot, string>(
  'robot/report',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/report/${id}`);
      return response.data as Robot;
    } catch (err: unknown) {
      let message: string;
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        message = data?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      return rejectWithValue(message);
    }
  }
);

export const rotateRobot = createAsyncThunk<Robot, { robot_id: string; direction: string }>(
  'robot/rotate',
  async ({ robot_id, direction }, { rejectWithValue }) => {
    try {
      const response = await api.post('/rotate', { robot_id, direction });
      return response.data as Robot;
    } catch (err: unknown) {
      let message: string;
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        message = data?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      return rejectWithValue(message);
    }
  }
);

export const moveRobot = createAsyncThunk<Robot, string>(
  'robot/move',
  async (robot_id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/move/${robot_id}`);
      return response.data as Robot;
    } catch (err: unknown) {
      let message: string;
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        message = data?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }
      return rejectWithValue(message);
    }
  }
);

// Slice
const robotSlice = createSlice({
  name: 'robot',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(placeRobot.fulfilled, (state, action: PayloadAction<Robot>) => {
        state.current = action.payload;
        state.history = [
          { x: action.payload.x, y: action.payload.y, facing: action.payload.facing },
        ];
      })
      .addCase(fetchReport.fulfilled, (state, action: PayloadAction<Robot>) => {
        state.current = action.payload;
      })
      .addCase(rotateRobot.fulfilled, (state, action: PayloadAction<Robot>) => {
        state.current = action.payload;
        state.history.push({ x: action.payload.x, y: action.payload.y, facing: action.payload.facing });
      })
      .addCase(moveRobot.fulfilled, (state, action: PayloadAction<Robot>) => {
        state.current = action.payload;
        state.history.push({ x: action.payload.x, y: action.payload.y, facing: action.payload.facing });
      })
      .addCase(fetchHistory.fulfilled, (state, action: PayloadAction<ServerHistoryEntry[]>) => {
        state.history = action.payload.map((entry) => ({
          x: entry.x,
          y: entry.y,
          facing: entry.facing,
        }));
      });
  },
});

export default robotSlice.reducer;
export const selectCurrentRobot = (state: RootState) => state.robot.current;
export const selectRobotHistory = (state: RootState) => state.robot.history; 
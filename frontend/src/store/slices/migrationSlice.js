import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchMigrationStatus = createAsyncThunk('migration/fetchStatus', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/migration/status');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchPhases = createAsyncThunk('migration/fetchPhases', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/migration/phases');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const startPhase = createAsyncThunk('migration/startPhase', async (phaseId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/migration/phases/${phaseId}/start`);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const rollbackPhase = createAsyncThunk('migration/rollbackPhase', async (phaseId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/migration/phases/${phaseId}/rollback`);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

const migrationSlice = createSlice({
  name: 'migration',
  initialState: { phases: [], status: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhases.pending, (state) => { state.loading = true; })
      .addCase(fetchPhases.fulfilled, (state, action) => { state.loading = false; state.phases = action.payload; })
      .addCase(fetchPhases.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMigrationStatus.fulfilled, (state, action) => { state.status = action.payload; })
      .addCase(startPhase.fulfilled, (state, action) => {
        const idx = state.phases.findIndex(p => p.id === action.payload.id);
        if (idx >= 0) state.phases[idx] = { ...state.phases[idx], ...action.payload };
      })
      .addCase(rollbackPhase.fulfilled, (state, action) => {
        const idx = state.phases.findIndex(p => p.id === action.payload.id);
        if (idx >= 0) state.phases[idx] = { ...state.phases[idx], ...action.payload };
      });
  },
});

export default migrationSlice.reducer;

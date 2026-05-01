import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchCurrentEmissions = createAsyncThunk('carbon/fetchCurrent', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/carbon/current');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchEmissionHistory = createAsyncThunk('carbon/fetchHistory', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/carbon/history', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchCarbonSavings = createAsyncThunk('carbon/fetchSavings', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/carbon/savings');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchWorkloadEmissions = createAsyncThunk('carbon/fetchWorkloads', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/carbon/workloads');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

const carbonSlice = createSlice({
  name: 'carbon',
  initialState: { current: null, history: [], savings: null, workloads: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentEmissions.pending, (state) => { state.loading = true; })
      .addCase(fetchCurrentEmissions.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchCurrentEmissions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchEmissionHistory.fulfilled, (state, action) => { state.history = action.payload; })
      .addCase(fetchCarbonSavings.fulfilled, (state, action) => { state.savings = action.payload; })
      .addCase(fetchWorkloadEmissions.fulfilled, (state, action) => { state.workloads = action.payload; });
  },
});

export default carbonSlice.reducer;

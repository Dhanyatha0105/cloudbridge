import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchInfraOverview = createAsyncThunk('infra/fetchOverview', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/infrastructure/overview');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchClusters = createAsyncThunk('infra/fetchClusters', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/infrastructure/clusters');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchNodes = createAsyncThunk('infra/fetchNodes', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/infrastructure/nodes');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchCompliance = createAsyncThunk('infra/fetchCompliance', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/infrastructure/compliance');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

const infrastructureSlice = createSlice({
  name: 'infrastructure',
  initialState: { overview: null, clusters: [], nodes: [], compliance: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInfraOverview.pending, (state) => { state.loading = true; })
      .addCase(fetchInfraOverview.fulfilled, (state, action) => { state.loading = false; state.overview = action.payload; })
      .addCase(fetchClusters.fulfilled, (state, action) => { state.clusters = action.payload; })
      .addCase(fetchNodes.fulfilled, (state, action) => { state.nodes = action.payload; })
      .addCase(fetchCompliance.fulfilled, (state, action) => { state.compliance = action.payload; });
  },
});

export default infrastructureSlice.reducer;

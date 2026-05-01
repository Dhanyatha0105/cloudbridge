import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchSapStatus = createAsyncThunk('integration/fetchSapStatus', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/integration/sap/status');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchIntegrationFlows = createAsyncThunk('integration/fetchFlows', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/integration/sap/flows');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchMessageLogs = createAsyncThunk('integration/fetchMessages', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/integration/sap/messages', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

export const fetchServiceNowStatus = createAsyncThunk('integration/fetchSnowStatus', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/integration/servicenow/status');
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.error); }
});

const integrationSlice = createSlice({
  name: 'integration',
  initialState: { sapStatus: null, flows: [], messages: [], snowStatus: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSapStatus.fulfilled, (state, action) => { state.sapStatus = action.payload; })
      .addCase(fetchIntegrationFlows.pending, (state) => { state.loading = true; })
      .addCase(fetchIntegrationFlows.fulfilled, (state, action) => { state.loading = false; state.flows = action.payload; })
      .addCase(fetchMessageLogs.fulfilled, (state, action) => { state.messages = action.payload; })
      .addCase(fetchServiceNowStatus.fulfilled, (state, action) => { state.snowStatus = action.payload; });
  },
});

export default integrationSlice.reducer;

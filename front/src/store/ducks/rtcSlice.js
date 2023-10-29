import { createSlice } from '@reduxjs/toolkit';

export const rtcSlice = createSlice({
  name: 'rtc',

  initialState: {},

  reducers: {},
});

export const authActions = rtcSlice.actions;
export const authReducer = rtcSlice.reducer;

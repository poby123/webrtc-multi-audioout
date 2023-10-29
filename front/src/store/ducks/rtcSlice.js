import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isActiveMic: false,
  isActiveVideo: false,
};

export const rtcSlice = createSlice({
  name: 'rtc',

  initialState: initialState,

  reducers: {
    setMicState: (state, action) => {
      state.isActiveMic = action.payload;
    },
    setVideoState: (state, action) => {
      state.isActiveVideo = action.payload;
    },
  },
});

export const rtcActions = rtcSlice.actions;
export const rtcReducer = rtcSlice.reducer;

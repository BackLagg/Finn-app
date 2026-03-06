import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@shared/types';

const initialState: User = {
  id: null,
  telegramId: null,
  username: '',
  name: '',
  role: '',
  isNew: true,
  isAccepted: false,
  createdAt: null,
  updatedAt: null,
  subscriptionTier: 'none',
  subscriptionExpiresAt: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<Partial<User>>) => {
      return { ...state, ...action.payload };
    },
    clearUserData: () => initialState,
  },
});

export const { setUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;


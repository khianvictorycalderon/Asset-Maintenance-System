import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserRole } from "../config";

// -----------------------------------------
// Add more here info to fetch from backend
// -----------------------------------------
export interface UserState {
  id: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  birth_date: string;
  role: UserRole | null;
  created_at: string;
  updated_at: string;
}

const initialState: UserState = {
  id: "",
  email: "",
  first_name: "",
  middle_name: null,
  last_name: "",
  birth_date: "",
  role: null,
  created_at: "",
  updated_at: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {

    // Overwrites the user state completely
    updateUser: (state, action: PayloadAction<UserState>) => {
      console.log("User updated!");
      const payload = action.payload;
      return {
        ...state,
        ...payload,
        role: payload.role || state.role || null
      };
    },

    // Resets the state back to initial values (e.g., on logout)
    clearUser: () => {
      console.log("User cleared!");
      return initialState;
    }
    
  }
});

export const { updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
import { combineReducers } from "redux"
import authReducer from "./auth.reducer";




const allReducers = combineReducers({
    auth: authReducer,
    //Thêm nhiều reducer ở đây
});

export default allReducers;
import { createStore, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // dùng localStorage
import {thunk} from "redux-thunk";
import allReducers from "./redux/reducers";

// Config redux-persist
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"] // ✅ chỉ persist reducer `auth`
};

// Gộp reducer persist
const persistedReducer = persistReducer(persistConfig, allReducers);

// Tạo store
const store = createStore(
  persistedReducer,
  applyMiddleware(thunk)
);

// Tạo persistor để sử dụng trong PersistGate
const persistor = persistStore(store);

export { store, persistor };

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import {Provider} from "react-redux"
import store from "./store"
import { SnackbarProvider } from "notistack";

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <App />
    </SnackbarProvider>
  </Provider>
);
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Provider } from "react-redux"
import store from "./store"
import { SnackbarProvider } from 'notistack';
import { HelmetProvider } from 'react-helmet-async';
import axios from 'axios';


axios.defaults.withCredentials = true;

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <HelmetProvider>
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <App />
      </SnackbarProvider>
    </HelmetProvider>
  </Provider>
);
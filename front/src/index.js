import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './store/store';
import { ThemeProvider } from 'styled-components';
import App from './App';
import './index.css';
import { theme } from './styles/theme';
import { RTCContextProvider } from 'features/rtc/RTCContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <RTCContextProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </RTCContextProvider>,
);

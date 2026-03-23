import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111d3e',
            color: '#fff',
            border: '1px solid #c9a227',
          },
          success: {
            iconTheme: { primary: '#c9a227', secondary: '#111d3e' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);

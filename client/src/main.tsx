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
            background: '#081228',
            color: '#d8e0f5',
            border: '1px solid #3b6ef8',
          },
          success: {
            iconTheme: { primary: '#3b6ef8', secondary: '#081228' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProviderWrapper, ReduxProvider } from './providers';
import App from './App';
import '@shared/lib/i18n';


const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <ReduxProvider>
    <QueryClientProviderWrapper>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProviderWrapper>
  </ReduxProvider>
);


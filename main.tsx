import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App';
import './index.css';
import { nearRpc } from './lib/nearRpcFailover';

// Expose nearRpc for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).nearRpc = nearRpc;
  console.log('[Debug] nearRpc exposed to window.nearRpc');
  console.log('[Debug] Try: await window.nearRpc.searchTransactionHash("YOUR_TX_HASH")');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


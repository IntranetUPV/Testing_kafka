import { StrictMode, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import App from './App.js';

createRoot(document.getElementById('root')).render(
  h(StrictMode, null, h(App))
);
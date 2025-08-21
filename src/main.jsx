import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Tailwind CSS 불러오기

createRoot(document.getElementById('root')).render(
  <App />
)
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import the environment initialization
import './utils/env'

createRoot(document.getElementById("root")!).render(<App />);

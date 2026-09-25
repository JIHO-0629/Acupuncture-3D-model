import { createRoot } from 'react-dom/client';
import '../../../app/globals.css';
import NeedlingWorkspacePreview from './preview';
import './preview.css';

createRoot(document.getElementById('root')!).render(<NeedlingWorkspacePreview />);

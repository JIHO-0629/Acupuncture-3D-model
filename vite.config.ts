import {rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));
// Design mockups stay in public/ for the dev server (/mockups/…) as the working record, but never ship.
const dropMockups=():Plugin=>({name:'drop-mockups',apply:'build',closeBundle(){rmSync(path('./dist/mockups'),{recursive:true,force:true});}});
export default defineConfig({root:path('./web'),publicDir:path('./public'),plugins:[react(),dropMockups()],resolve:{alias:{'@':path('./')}},css:{postcss:{plugins:[tailwindcss()]}},server:{watch:{usePolling:true}},build:{outDir:path('./dist'),emptyOutDir:true}});

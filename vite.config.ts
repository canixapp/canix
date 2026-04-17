import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import pkg from './package.json';
import crypto from "node:crypto";
import fs from "node:fs";

function getSourceHash(dir, excludePatterns = []) {
  if (!fs.existsSync(dir)) return '0';
  const files = fs.readdirSync(dir, { recursive: true });
  const hash = crypto.createHash('md5');
  files.forEach(f => {
    const p = path.join(dir, f);
    const isExcluded = excludePatterns.some(pattern => p.replace(/\\/g, '/').includes(pattern));
    
    if (fs.statSync(p).isFile() && !isExcluded) {
      hash.update(fs.readFileSync(p));
    }
  });
  return hash.digest('hex').substring(0, 8);
}

const appFingerprint = getSourceHash(path.resolve(__dirname, 'src'), ['src/pages/hub', 'src/components/hub']);
const globalFingerprint = getSourceHash(path.resolve(__dirname, 'src'));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __CODE_FINGERPRINT__: JSON.stringify(globalFingerprint),
    __APP_FINGERPRINT__: JSON.stringify(appFingerprint),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'recharts', 'date-fns', 'clsx', 'tailwind-merge'],
          'radix-ui': ['@radix-ui/react-dialog', '@radix-ui/react-tooltip', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-slot'],
        }
      }
    }
  }
}));

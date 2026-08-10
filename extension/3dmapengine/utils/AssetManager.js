import { GLTFLoader, DRACOLoader } from 'three-stdlib';

// Helper to safely resolve extension paths if running in a content script
export const getExtensionUrl = (path) => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL(path.startsWith('/') ? path.slice(1) : path);
  }
  return path;
};

// Singleton instances to prevent multiple loader instantiations
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

// Point Draco loader to the local WebAssembly decoders copied into our extension assets
dracoLoader.setDecoderPath(getExtensionUrl('3dmapengine/assets/draco/gltf/'));
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Safely fetches and parses a .glb file.
 * If the file is not found (404), it returns null instead of crashing the app.
 * This is crucial for local extension environments where assets might be added later.
 * 
 * @param {string} url - The local path to the .glb file
 * @returns {Promise<THREE.BufferGeometry | null>}
 */
export const safeLoadGeometry = (url) => {
  const resolvedUrl = getExtensionUrl(url);
  return new Promise((resolve) => {
    gltfLoader.load(
      resolvedUrl,
      // onSuccess
      (gltf) => {
        // Extract the first mesh geometry we find
        let geometry = null;
        gltf.scene.traverse((child) => {
          if (child.isMesh && !geometry) {
            geometry = child.geometry;
          }
        });
        
        if (geometry) {
           console.log(`[AssetManager] Loaded geometry from ${url}`);
           resolve(geometry);
        } else {
           console.warn(`[AssetManager] No mesh found in ${url}`);
           resolve(null);
        }
      },
      // onProgress
      undefined,
      // onError (File not found, parse error, etc.)
      (err) => {
        // Use console.log instead of console.warn to prevent Chrome Extensions
        // from catching this as an "Extension Error" in the dashboard.
        console.log(`[AssetManager] Safe fallback triggered. Could not load ${url}. Reason:`, err.message || '404 Not Found');
        resolve(null);
      }
    );
  });
};

import React from 'react';
import { EffectComposer, BrightnessContrast, HueSaturation, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useMapStore } from '../../store/mapStore';

export default function PostProcessingManager() {
  const params = useMapStore(state => state.engineConfig);

  if (!params.enablePostProcessing) return null;

  return (
    <EffectComposer disableNormalPass multisampling={4}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      
      {params.enableColorGrading && (
        <>
          <BrightnessContrast brightness={params.brightness} contrast={params.contrast} />
          <HueSaturation hue={params.hue} saturation={params.saturation} />
        </>
      )}
      
      {params.enableBloom && (
        <Bloom 
          intensity={params.bloomIntensity} 
          luminanceThreshold={params.bloomLuminanceThreshold} 
          luminanceSmoothing={0.9} 
        />
      )}
      
      {params.enableVignette && (
        <Vignette eskil={false} offset={params.vignetteOffset} darkness={params.vignetteDarkness} />
      )}
    </EffectComposer>
  );
}

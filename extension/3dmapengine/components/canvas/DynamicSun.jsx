import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const centerVec = new THREE.Vector2(0, 0);
const mapCenterVec = new THREE.Vector3(0, 0, 0);

export default function DynamicSun() {
  const lightNearRef = useRef();
  const targetNearRef = useRef();
  const helperNearRef = useRef(null);
  
  const lightFarRef = useRef();
  const targetFarRef = useRef();
  const helperFarRef = useRef(null);

  const { camera, scene } = useThree();
  const shadowsEnabled = useMapStore(state => state.shadowsEnabled);
  const cameraMode = useMapStore(state => state.cameraMode);
  
  // Read all config from unified store
  const params = useMapStore(state => state.engineConfig);

  useFrame(() => {
    if (!shadowsEnabled || cameraMode !== 'isometric') return;

    const lightDirVector = new THREE.Vector3(params.lightDirX, params.lightDirY, params.lightDirZ).normalize();

    // 1. Update Near Sun
    if (params.enableNear && lightNearRef.current && targetNearRef.current) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(centerVec, camera);
      const targetVector = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, targetVector);
      
      if (targetVector) {
        lightNearRef.current.position.copy(targetVector).sub(lightDirVector.clone().multiplyScalar(params.nearMargin));
        targetNearRef.current.position.copy(targetVector);
      }
      lightNearRef.current.target = targetNearRef.current;
      
      // Force camera math update
      if (lightNearRef.current.shadow && lightNearRef.current.shadow.camera) {
        lightNearRef.current.shadow.camera.near = params.nearNear;
        lightNearRef.current.shadow.camera.far = params.nearFar;
        lightNearRef.current.shadow.camera.left = -params.nearSize;
        lightNearRef.current.shadow.camera.right = params.nearSize;
        lightNearRef.current.shadow.camera.top = params.nearSize;
        lightNearRef.current.shadow.camera.bottom = -params.nearSize;
        lightNearRef.current.shadow.camera.updateProjectionMatrix();
      }
    }

    // 2. Update Far Sun
    if (params.enableFar && lightFarRef.current && targetFarRef.current) {
      lightFarRef.current.position.copy(mapCenterVec).sub(lightDirVector.clone().multiplyScalar(params.farMargin));
      targetFarRef.current.position.copy(mapCenterVec);
      lightFarRef.current.target = targetFarRef.current;
      
      // Force camera math update
      if (lightFarRef.current.shadow && lightFarRef.current.shadow.camera) {
        lightFarRef.current.shadow.camera.near = params.farNear;
        lightFarRef.current.shadow.camera.far = params.farFar;
        lightFarRef.current.shadow.camera.left = -params.farSize;
        lightFarRef.current.shadow.camera.right = params.farSize;
        lightFarRef.current.shadow.camera.top = params.farSize;
        lightFarRef.current.shadow.camera.bottom = -params.farSize;
        lightFarRef.current.shadow.camera.updateProjectionMatrix();
      }
    }

    // 3. Handle Helpers
    if (params.displayHelper) {
      if (params.enableNear && lightNearRef.current && !helperNearRef.current) {
        helperNearRef.current = new THREE.CameraHelper(lightNearRef.current.shadow.camera);
        scene.add(helperNearRef.current);
      }
      if (params.enableFar && lightFarRef.current && !helperFarRef.current) {
        helperFarRef.current = new THREE.CameraHelper(lightFarRef.current.shadow.camera);
        scene.add(helperFarRef.current);
      }
      if (helperNearRef.current) helperNearRef.current.update();
      if (helperFarRef.current) helperFarRef.current.update();
    } else {
      if (helperNearRef.current) { scene.remove(helperNearRef.current); helperNearRef.current.dispose(); helperNearRef.current = null; }
      if (helperFarRef.current) { scene.remove(helperFarRef.current); helperFarRef.current.dispose(); helperFarRef.current = null; }
    }
  });

  if (!shadowsEnabled || cameraMode !== 'isometric') return null;

  return (
    <>
      <ambientLight intensity={0.2} />
      <hemisphereLight skyColor="#ffffff" groundColor="#222222" intensity={0.3} />

      {params.enableNear && (
        <>
          <directionalLight
            key={`near-${params.nearMapSize}`}
            ref={lightNearRef}
            castShadow
            intensity={params.intensity}
            shadow-mapSize={[params.nearMapSize, params.nearMapSize]}
            shadow-camera-near={params.nearNear}
            shadow-camera-far={params.nearFar}
            shadow-camera-left={-params.nearSize}
            shadow-camera-right={params.nearSize}
            shadow-camera-top={params.nearSize}
            shadow-camera-bottom={-params.nearSize}
            shadow-bias={params.nearBias}
            shadow-radius={1}
          />
          <object3D ref={targetNearRef} />
        </>
      )}

      {params.enableFar && (
        <>
          <directionalLight
            key={`far-${params.farMapSize}`}
            ref={lightFarRef}
            castShadow
            intensity={params.intensity}
            shadow-mapSize={[params.farMapSize, params.farMapSize]}
            shadow-camera-near={params.farNear}
            shadow-camera-far={params.farFar}
            shadow-camera-left={-params.farSize}
            shadow-camera-right={params.farSize}
            shadow-camera-top={params.farSize}
            shadow-camera-bottom={-params.farSize}
            shadow-bias={params.farBias}
            shadow-radius={0}
          />
          <object3D ref={targetFarRef} />
        </>
      )}
    </>
  );
}

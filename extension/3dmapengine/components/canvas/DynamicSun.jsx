import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { useMapStore } from '../../store/mapStore';

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const centerVec = new THREE.Vector2(0, 0);
const targetVector = new THREE.Vector3();

export default function DynamicSun() {
  const lightRef = useRef();
  const targetRef = useRef();
  const guiRef = useRef();
  const { camera, scene } = useThree();
  const shadowsEnabled = useMapStore(state => state.shadowsEnabled);
  const cameraMode = useMapStore(state => state.cameraMode);

  const [params] = useState({
    offsetX: 30,
    offsetY: 80,
    offsetZ: 30,
    intensity: 2.0,
    shadowSize: 60, // Size of the shadow box
    shadowRadius: 2, // Softness
    showDebug: true
  });

  useEffect(() => {
    if (!shadowsEnabled || cameraMode !== 'isometric') return;

    if (params.showDebug && !guiRef.current) {
      const gui = new GUI({ title: 'Dynamic Sun Config' });
      guiRef.current = gui;

      gui.add(params, 'offsetX', -200, 200);
      gui.add(params, 'offsetY', 10, 200);
      gui.add(params, 'offsetZ', -200, 200);
      gui.add(params, 'intensity', 0, 5).onChange(v => {
        if (lightRef.current) lightRef.current.intensity = v;
      });
      gui.add(params, 'shadowSize', 20, 300).onChange(v => {
        if (lightRef.current) {
          lightRef.current.shadow.camera.left = -v;
          lightRef.current.shadow.camera.right = v;
          lightRef.current.shadow.camera.top = v;
          lightRef.current.shadow.camera.bottom = -v;
          lightRef.current.shadow.camera.updateProjectionMatrix();
        }
      });
      gui.add(params, 'shadowRadius', 0, 10).onChange(v => {
        if (lightRef.current) lightRef.current.shadow.radius = v;
      });
    }

    return () => {
      if (guiRef.current) {
        guiRef.current.destroy();
        guiRef.current = null;
      }
    };
  }, [shadowsEnabled, cameraMode, params]);

  useFrame(() => {
    if (lightRef.current && targetRef.current && cameraMode === 'isometric') {
      // Raycast to find exactly what the user is looking at on the ground (Y=0)
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(centerVec, camera);
      raycaster.ray.intersectPlane(groundPlane, targetVector);
      
      if (targetVector) {
        lightRef.current.position.set(
          targetVector.x + params.offsetX,
          params.offsetY,
          targetVector.z + params.offsetZ
        );
        targetRef.current.position.copy(targetVector);
      }
      lightRef.current.target = targetRef.current;
    }
  });

  if (!shadowsEnabled || cameraMode !== 'isometric') return null;

  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight skyColor="#ffffff" groundColor="#222222" intensity={0.4} />
      <directionalLight
        ref={lightRef}
        castShadow
        intensity={params.intensity}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-camera-left={-params.shadowSize}
        shadow-camera-right={params.shadowSize}
        shadow-camera-top={params.shadowSize}
        shadow-camera-bottom={-params.shadowSize}
        shadow-bias={-0.001}
        shadow-radius={params.shadowRadius}
      />
      <object3D ref={targetRef} />
    </>
  );
}

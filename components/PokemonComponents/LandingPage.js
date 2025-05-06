import React, { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber/native";
import { useGLTF } from "@react-three/drei/native";
import modelPath from "../../assets/models/Completed_teeth.glb";

// Model component
function Model({ modelUri }) {
  const { scene } = useGLTF(modelUri);

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material.color.set("#ffffff"); // Example: set material color to white
          child.material.metalness = 0.2;
          child.material.roughness = 0.8;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [scene]);

  return <primitive object={scene} />;
}

// Main App component
export default function App() {
  return (
    <Canvas>
      <ambientLight />
      <Suspense fallback={null}>
        <Model modelUri={modelPath} />
      </Suspense>
    </Canvas>
  );
}

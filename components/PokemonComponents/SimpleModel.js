import React, { useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";

function SimpleModel() {
  const modelPath = require("../../assets/models/Dental_Model_Mobile.glb");
  const { scene } = useGLTF(modelPath);

  const [clickStates, setClickStates] = useState({});

  const handleClick = (e) => {
    e.stopPropagation();

    const mesh = e.object;
    const id = mesh.uuid;

    const current = clickStates[id] || "original";
    let nextColor;

    switch (current) {
      case "red":
        nextColor = "blue";
        break;
      case "blue":
        nextColor = "original";
        break;
      default:
        nextColor = "red";
        break;
    }

    if (nextColor === "original") {
      mesh.material.color.copy(mesh.userData.originalColor); // Restore original color
    } else {
      mesh.material.color.set(nextColor);
    }

    setClickStates((prev) => ({ ...prev, [id]: nextColor }));
  };

  useFrame(() => {
    scene.traverse((child) => {
      if (child.isMesh && !child.userData.initialized) {
        child.userData.initialized = true;

        // Save original color for restoration
        child.userData.originalColor = child.material.color.clone();

        // Clone material to avoid sharing between meshes
        child.material = child.material.clone();

        // Attach mobile-friendly touch event
        child.onTouchStart = handleClick;
      }
    });
  });

  return <primitive object={scene} />;
}

export default SimpleModel;

// src/screens/SimpleModel.js
import React, { useState, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from 'three';

function SimpleModel({ onLoad }) {
  // Load the model - ensure path is correct
  const modelPath = require("../../assets/models/Dental_Model_Mobile.glb");
  const { scene } = useGLTF(modelPath);
  
  // Track click states for all meshes
  const [clickStates, setClickStates] = useState({});
  // Flag to ensure we only run initialization once
  const [initialized, setInitialized] = useState(false);
  
  // Use a ref to store the scene
  const sceneRef = useRef();
  // Use a ref to store T11_labial for direct access
  const t11Ref = useRef();
  // Use a ref for the interactive mesh
  const interactiveMeshRef = useRef();
  
  // Initialize meshes and materials only once
  useEffect(() => {
    if (!scene) {
      console.error("Model scene is undefined");
      return;
    }
    
    try {
      // Set scene to the ref
      sceneRef.current = scene;
      
      // Traverse all objects in the scene
      scene.traverse((object) => {
        if (!object.isMesh) return;
        
        console.log("Found mesh:", object.name);
        
        // Store original color
        if (object.material) {
          if (!object.userData) object.userData = {};
          object.userData.originalColor = object.material.color.clone();
          
          // Clone material to avoid sharing
          object.material = object.material.clone();
        }
        
        // Find T11_labial
        if (object.name === "T11_labial" || object.name.toLowerCase().includes("t11_labial")) {
          console.log("Found T11_labial mesh!");
          t11Ref.current = object;
        }
      });
      
      // Mark as initialized
      setInitialized(true);
      
      // Notify parent component that model is loaded
      if (onLoad && typeof onLoad === 'function') {
        onLoad();
      }
    } catch (error) {
      console.error("Error initializing model:", error);
    }
  }, [scene, modelPath, onLoad]);
  
  // Handle mesh interactions via useFrame instead of relying on event props
  useFrame(() => {
    // Skip if not initialized
    if (!initialized || !sceneRef.current) return;
  });

  // Handle clicking the T11_labial tooth directly
  const handleT11Click = (e) => {
    if (!t11Ref.current) {
      console.log("T11_labial reference not found");
      return;
    }
    
    const mesh = t11Ref.current;
    const id = mesh.uuid;
    
    console.log("T11_labial clicked");
    
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
    
    if (nextColor === "original" && mesh.userData && mesh.userData.originalColor) {
      // Restore original color
      mesh.material.color.copy(mesh.userData.originalColor);
    } else {
      // Set new color
      mesh.material.color.set(nextColor);
    }
    
    setClickStates((prev) => ({ ...prev, [id]: nextColor }));
  };
  
  return (
    <group>
      {/* Render the scene */}
      {scene && <primitive object={scene} />}
      
      {/* Add an invisible interactive mesh where T11_labial is */}
      {t11Ref.current && (
        <mesh
          ref={interactiveMeshRef}
          position={t11Ref.current.position}
          scale={[0.5, 0.5, 0.5]}
          onClick={handleT11Click}
          onPointerDown={handleT11Click}
          visible={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

// Preload the model to improve performance
try {
  useGLTF.preload(require("../../assets/models/Dental_Model_Mobile.glb"));
} catch (error) {
  console.error("Error preloading model:", error);
}

export default SimpleModel;
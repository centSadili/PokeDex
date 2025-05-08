import React, { useState, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from 'three';
import { Asset } from 'expo-asset';

function SimpleModel({ onLoad }) {
  // Load the model - ensure path is correct
  const modelPath = Asset.fromModule(require("../../assets/models/Dental_Model_Mobile.glb"));
  const { scene } = useGLTF(modelPath.uri);
  
  // Track click states for all meshes
  const [clickStates, setClickStates] = useState({});
  // Flag to ensure we only run initialization once
  const [initialized, setInitialized] = useState(false);
  
  // Use a ref to store the scene
  const sceneRef = useRef();
  // Use refs to store interactive parts
  const interactiveRefs = useRef({});
  
  // Define all interactive parts
  const interactiveParts = new Set([
    // Occlusal parts
    "T38_occlusal", "T37_occlusal", "T36_occlusal", "T35_occlusal", "T34_occlusal",
    "T48_occlusal", "T47_occlusal", "T46_occlusal", "T45_occlusal", "T44_occlusal",
    "T28_occlusal", "T27_occlusal", "T26_occlusal", "T25_occlusal", "T24_occlusal",
    "T18_occlusal", "T17_occlusal", "T16_occlusal", "T15_occlusal", "T14_occlusal",

    // Buccal parts
    "T38_buccal", "T37_buccal", "T36_buccal", "T35_buccal", "T34_buccal",
    "T48_buccal", "T47_buccal", "T46_buccal", "T45_buccal", "T44_buccal",
    "T28_buccal", "T27_buccal", "T26_buccal", "T25_buccal", "T24_buccal",
    "T18_buccal", "T17_buccal", "T16_buccal", "T15_buccal", "T14_buccal",

    // Distal parts
    "T38_distal", "T37_distal", "T36_distal", "T35_distal", "T34_distal",
    "T48_distal", "T47_distal", "T46_distal", "T45_distal", "T44_distal",
    "T28_distal", "T27_distal", "T26_distal", "T25_distal", "T24_distal",
    "T18_distal", "T17_distal", "T16_distal", "T15_distal", "T14_distal",

    // Mesial parts
    "T38_mesial", "T37_mesial", "T36_mesial", "T35_mesial", "T34_mesial",
    "T48_mesial", "T47_mesial", "T46_mesial", "T45_mesial", "T44_mesial",
    "T28_mesial", "T27_mesial", "T26_mesial", "T25_mesial", "T24_mesial",
    "T18_mesial", "T17_mesial", "T16_mesial", "T15_mesial", "T14_mesial",

    // Lingual parts
    "T38_lingual", "T37_lingual", "T36_lingual", "T35_lingual", "T34_lingual",
    "T48_lingual", "T47_lingual", "T46_lingual", "T45_lingual", "T44_lingual",
    "T28_lingual", "T27_lingual", "T26_lingual", "T25_lingual", "T24_lingual",
    "T18_lingual", "T17_lingual", "T16_lingual", "T15_lingual", "T14_lingual",

    // Labial parts (and matching lingual, mesial, distal, incisal)
    "T13_labial", "T12_labial", "T11_labial",
    "T43_labial", "T42_labial", "T41_labial",
    "T31_labial", "T32_labial", "T33_labial",
    "T21_labial", "T22_labial", "T23_labial",

    "T13_lingual", "T12_lingual", "T11_lingual",
    "T43_lingual", "T42_lingual", "T41_lingual",
    "T31_lingual", "T32_lingual", "T33_lingual",
    "T21_lingual", "T22_lingual", "T23_lingual",

    "T13_mesial", "T12_mesial", "T11_mesial",
    "T43_mesial", "T42_mesial", "T41_mesial",
    "T31_mesial", "T32_mesial", "T33_mesial",
    "T21_mesial", "T22_mesial", "T23_mesial",

    "T13_distal", "T12_distal", "T11_distal",
    "T43_distal", "T42_distal", "T41_distal",
    "T31_distal", "T32_distal", "T33_distal",
    "T21_distal", "T22_distal", "T23_distal",

    // Incisal parts
    "T13_incisal", "T12_incisal", "T11_incisal",
    "T43_incisal", "T42_incisal", "T41_incisal",
    "T31_incisal", "T32_incisal", "T33_incisal",
    "T21_incisal", "T22_incisal", "T23_incisal", 
  ]);
  
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
        
        // Store original color for all meshes
        if (object.material) {
          if (!object.userData) object.userData = {};
          object.userData.originalColor = object.material.color.clone();
          
          // Clone material to avoid sharing
          object.material = object.material.clone();
        }
        
        // Check if this mesh is in our interactive parts list
        if (interactiveParts.has(object.name)) {
          console.log("Found interactive mesh:", object.name);
          
          // Store reference to this mesh
          interactiveRefs.current[object.name] = object;
          
          // Mark as clickable
          object.userData.clickable = true;
        }
      });
      
      // Count the number of found interactive parts
      const foundParts = Object.keys(interactiveRefs.current).length;
      console.log(`Found ${foundParts} out of ${interactiveParts.size} interactive parts`);
      
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
  
  // Use raycaster to handle clicks on the entire model
  useFrame((state) => {
    // Skip if not initialized
    if (!initialized || !sceneRef.current) return;
    
    // Check if any pointer is down
    if (state.pointer.buttons > 0 && state.events.connected) {
      // Get objects intersecting the ray
      const intersects = state.raycaster.intersectObject(sceneRef.current, true);
      
      // Check for intersections with any interactive part
      for (const intersection of intersects) {
        const object = intersection.object;
        
        // Check if this is a clickable object
        if (object.userData && object.userData.clickable) {
          console.log(`Detected click on ${object.name} via raycaster`);
          handlePartClick(object);
          break;
        }
      }
    }
  });

  // Handle clicking any interactive part
  const handlePartClick = (mesh) => {
    if (!mesh) {
      console.log("Interactive mesh reference not found");
      return;
    }
    
    const id = mesh.uuid;
    const name = mesh.name;
    
    console.log(`${name} clicked`);
    
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
    <group 
      onClick={(e) => {
        // Check if we clicked on any interactive part
        if (e.object.userData && e.object.userData.clickable) {
          e.stopPropagation();
          handlePartClick(e.object);
        }
      }}
    >
      {/* Render the scene */}
      {scene && <primitive object={scene} />}
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
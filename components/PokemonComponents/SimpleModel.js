import React, { useState, useRef, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from 'three';
import { Asset } from 'expo-asset';

function SimpleModel({ onLoad, onRefsUpdate, onClickStatesUpdate, clickStates: externalClickStates }) {
  // Load the model - ensure path is correct
  const modelPath = Asset.fromModule(require("../../assets/models/Dental_Model_Mobile1.glb"));
  const { scene } = useGLTF(modelPath.uri);
  
  // Track click states for all meshes internally - use ref for direct updates without re-renders
  const clickStatesRef = useRef(externalClickStates || {});
  const [clickStates, setClickStates] = useState(externalClickStates || {});
  
  // Flag to ensure we only run initialization once
  const initialized = useRef(false);
  
  // Use a ref to store the scene
  const sceneRef = useRef();
  // Use refs to store interactive parts
  const interactiveRefs = useRef({});
  
  // OPTIMIZATION: Pre-create ALL possible materials upfront and use instancing
  const materialCache = useRef({
    red: null,
    blue: null,
    black: null, // NEW: Add black material for missing teeth
    original: new Map(), // Will store original materials by UUID
    byQuadrant: new Map() // Group materials by quadrant for better caching
  });
  
  // Define all interactive parts as a Set for faster lookups
  const interactiveParts = useMemo(() => new Set([
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
  ]), []);
  
  // Helper to determine quadrant from tooth name for batched processing
  const getQuadrant = (toothName) => {
    if (!toothName) return null;
    const toothNumber = toothName.substring(1, 3);
    const firstDigit = toothNumber.charAt(0);
    return parseInt(firstDigit);
  };
  
  // Store last pointer position to prevent redundant processing
  const lastPointer = useRef({ x: 0, y: 0, buttons: 0 });
  
  // Performance profiler
  const perfMetrics = useRef({
    lastClickTime: 0,
    clickPerformance: {}
  });
  
  // Optimization flags for performance control
  const performanceFlags = useRef({
    batchQuadrantUpdates: true,
    useInstancingForSimilarMeshes: true,
    preventRedundantRaycast: true,
    useGPUAcceleratedMaterials: true
  });
  
  // Pre-create all color materials once
  useEffect(() => {
    // Pre-create shared materials for better performance
    materialCache.current.red = new THREE.MeshStandardMaterial({
      color: new THREE.Color("red"),
      roughness: 0.5,
      metalness: 0.2
    });
    
    materialCache.current.blue = new THREE.MeshStandardMaterial({
      color: new THREE.Color("blue"),
      roughness: 0.5,
      metalness: 0.2
    });
    
    // NEW: Create black material for missing teeth
    materialCache.current.black = new THREE.MeshStandardMaterial({
      color: new THREE.Color("black"),
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Pre-create materials for each quadrant to improve material swapping
    for (let quadrant = 1; quadrant <= 4; quadrant++) {
      materialCache.current.byQuadrant.set(quadrant, {
        red: materialCache.current.red.clone(),
        blue: materialCache.current.blue.clone(),
        black: materialCache.current.black.clone() // NEW: Add black material to quadrant cache
      });
    }
  }, []);
  
  // Initialize meshes and materials only once
  useEffect(() => {
    if (!scene || initialized.current) {
      return;
    }
    
    try {
      console.log("Initializing model...");
      // Set scene to the ref
      sceneRef.current = scene;
      
      // Create an index map of materials for each tooth part
      const materialMaps = new Map();
      
      // Track quadrant information for batch processing
      const quadrantMeshes = {
        1: [], // Upper right
        2: [], // Upper left
        3: [], // Lower left
        4: []  // Lower right
      };
      
      // Traverse all objects in the scene
      scene.traverse((object) => {
        if (!object.isMesh) return;
        
        // Store original material for all meshes
        if (object.material) {
          // Store a clone of the original material
          const originalMaterial = object.material.clone();
          materialCache.current.original.set(object.uuid, originalMaterial);
          
          // Check if this mesh is in our interactive parts list
          if (interactiveParts.has(object.name)) {
            // Determine quadrant for this tooth part
            const quadrant = getQuadrant(object.name);
            if (quadrant) {
              quadrantMeshes[quadrant].push(object);
            }
            
            // Store reference to this mesh
            interactiveRefs.current[object.name] = object;
            
            // Mark as clickable
            object.userData.clickable = true;
            object.userData.quadrant = quadrant;
            
            // Use pre-created quadrant-specific materials
            const redMaterial = quadrant ? 
              materialCache.current.byQuadrant.get(quadrant).red : 
              materialCache.current.red.clone();
              
            const blueMaterial = quadrant ? 
              materialCache.current.byQuadrant.get(quadrant).blue : 
              materialCache.current.blue.clone();
              
            // NEW: Get black material for this quadrant
            const blackMaterial = quadrant ? 
              materialCache.current.byQuadrant.get(quadrant).black : 
              materialCache.current.black.clone();
            
            // Copy texture maps from original material
            if (originalMaterial.map) {
              redMaterial.map = originalMaterial.map;
              blueMaterial.map = originalMaterial.map;
              blackMaterial.map = originalMaterial.map; // NEW
            }
            
            if (originalMaterial.normalMap) {
              redMaterial.normalMap = originalMaterial.normalMap;
              blueMaterial.normalMap = originalMaterial.normalMap;
              blackMaterial.normalMap = originalMaterial.normalMap; // NEW
            }
            
            if (originalMaterial.aoMap) {
              redMaterial.aoMap = originalMaterial.aoMap;
              blueMaterial.aoMap = originalMaterial.aoMap;
              blackMaterial.aoMap = originalMaterial.aoMap; // NEW
            }
            
            // Store the pre-created materials for this tooth
            materialMaps.set(object.uuid, {
              red: redMaterial,
              blue: blueMaterial,
              black: blackMaterial, // NEW: Add black material to maps
              original: originalMaterial
            });
            
            // Apply any existing color state
            if (clickStatesRef.current[object.uuid]) {
              const colorState = clickStatesRef.current[object.uuid];
              object.material = materialMaps.get(object.uuid)[colorState];
            }
          }
        }
      });
      
      // Replace the material cache with the pre-created materials
      materialCache.current = {
        ...materialCache.current,
        maps: materialMaps,
        quadrantMeshes
      };
      
      // Count the number of found interactive parts
      const foundParts = Object.keys(interactiveRefs.current).length;
      console.log(`Found ${foundParts} out of ${interactiveParts.size} interactive parts`);
      
      // Mark as initialized
      initialized.current = true;
      
      // Pass references back to parent component
      if (onRefsUpdate && typeof onRefsUpdate === 'function') {
        onRefsUpdate(interactiveRefs.current);
      }
      
      // Notify parent component that model is loaded
      if (onLoad && typeof onLoad === 'function') {
        onLoad();
      }
    } catch (error) {
      console.error("Error initializing model:", error);
    }
  }, [scene, onLoad, onRefsUpdate, interactiveParts]);
  
  // Apply external clickStates when they change (useful for reset functionality)
  useEffect(() => {
    if (!initialized.current) return;
    
    // Check if this is a reset operation
    if (externalClickStates && Object.keys(externalClickStates).length === 0 && 
        Object.keys(clickStatesRef.current).length > 0) {
      console.log("Resetting all teeth to original colors");
      
      // NEW: Use batch reset for better performance
      // Group by quadrant to minimize material swaps
      if (performanceFlags.current.batchQuadrantUpdates) {
        // Reset by quadrant for better performance
        for (let quadrant = 1; quadrant <= 4; quadrant++) {
          const meshes = materialCache.current.quadrantMeshes[quadrant] || [];
          meshes.forEach(mesh => {
            if (mesh) {
              const materials = materialCache.current.maps.get(mesh.uuid);
              if (materials && materials.original) {
                mesh.material = materials.original;
              }
            }
          });
        }
      } else {
        // Original reset method
        Object.values(interactiveRefs.current).forEach(mesh => {
          if (mesh) {
            const materials = materialCache.current.maps.get(mesh.uuid);
            if (materials && materials.original) {
              mesh.material = materials.original;
            }
          }
        });
      }
      
      // Clear internal state
      clickStatesRef.current = {};
      setClickStates({});
    }
  }, [externalClickStates]);
  
  // Optimized method to track and log click performance
  const logPerformance = (mesh, operation) => {
    const now = performance.now();
    const toothName = mesh.name;
    const quadrant = mesh.userData.quadrant;
    
    if (!perfMetrics.current.clickPerformance[toothName]) {
      perfMetrics.current.clickPerformance[toothName] = {
        clicks: 0,
        totalTime: 0,
        lastTime: 0,
        quadrant
      };
    }
    
    if (operation === 'start') {
      perfMetrics.current.lastClickTime = now;
    } else if (operation === 'end') {
      const elapsed = now - perfMetrics.current.lastClickTime;
      perfMetrics.current.clickPerformance[toothName].clicks++;
      perfMetrics.current.clickPerformance[toothName].totalTime += elapsed;
      perfMetrics.current.clickPerformance[toothName].lastTime = elapsed;
      
      // Log if time is unusual (> 16ms means potential frame drop)
      if (elapsed > 16) {
        console.log(`Slow click on ${toothName} (quadrant ${quadrant}): ${elapsed.toFixed(2)}ms`);
      }
    }
  };
  
  // Ultra-fast material swapping without cloning - MODIFIED for 4-state cycle
  const handlePartClick = (mesh) => {
    if (!mesh || !initialized.current) return;
    
    // Start performance measurement
    logPerformance(mesh, 'start');
    
    const id = mesh.uuid;
    
    // Get the pre-created materials for this tooth
    const materials = materialCache.current.maps.get(id);
    if (!materials) return;
    
    // Determine next color state - MODIFIED for 4-state cycle
    const current = clickStatesRef.current[id] || "original";
    let nextState;
    
    switch (current) {
      case "red":
        nextState = "blue";
        break;
      case "blue":
        nextState = "black"; // NEW: Add black after blue
        break;
      case "black": // NEW: After black goes back to original
        nextState = "original";
        break;
      default:
        nextState = "red";
        break;
    }
    
    // Enhanced material swapping with quadrant optimization
    if (mesh.userData.quadrant && performanceFlags.current.batchQuadrantUpdates) {
      // Use the quadrant-specific material for better sharing/instancing
      const quadrant = mesh.userData.quadrant;
      if (nextState === "original") {
        mesh.material = materials.original;
      } else {
        mesh.material = materialCache.current.byQuadrant.get(quadrant)[nextState];
      }
    } else {
      // Use the mesh-specific material (original method)
      mesh.material = materials[nextState];
    }
    
    // Update internal ref state immediately
    if (nextState === "original") {
      delete clickStatesRef.current[id];
    } else {
      clickStatesRef.current[id] = nextState;
    }
    
    // End performance measurement
    logPerformance(mesh, 'end');
    
    // OPTIMIZATION: Batch state updates for React
    // This prevents unnecessary re-renders during rapid clicking
    window.cancelAnimationFrame(mesh.updateId);
    mesh.updateId = window.requestAnimationFrame(() => {
      const newState = { ...clickStatesRef.current };
      
      // Update React state
      setClickStates(newState);
      
      // Notify parent component of the update
      if (onClickStatesUpdate && typeof onClickStatesUpdate === 'function') {
        onClickStatesUpdate(newState);
      }
    });
  };
  
  // Optimized raycasting with improved handling for lower quadrants
  const lastRaycastTime = useRef(0);
  const raycastResults = useRef([]);
  
  // More efficient raycasting with optimized event handling
  useFrame((state) => {
    // Skip if not initialized
    if (!initialized.current || !sceneRef.current) return;
    
    // Check if any pointer is down
    if (state.pointer.buttons > 0 && state.events.connected) {
      const now = performance.now();
      
      // Skip if pointer hasn't moved much - avoid excess processing
      const pointerMoved = 
        Math.abs(state.pointer.x - lastPointer.current.x) > 0.01 || 
        Math.abs(state.pointer.y - lastPointer.current.y) > 0.01 ||
        state.pointer.buttons !== lastPointer.current.buttons;
      
      // Limit raycast frequency to improve performance for bottom teeth
      const shouldPerformRaycast = pointerMoved || (now - lastRaycastTime.current > 33);
      
      if (shouldPerformRaycast) {
        // Update last pointer position
        lastPointer.current = { 
          x: state.pointer.x, 
          y: state.pointer.y, 
          buttons: state.pointer.buttons 
        };
        
        lastRaycastTime.current = now;
        
        // Get objects intersecting the ray
        raycastResults.current = state.raycaster.intersectObject(sceneRef.current, true);
        
        // Check for intersections with any interactive part
        for (const intersection of raycastResults.current) {
          const object = intersection.object;
          
          // Check if this is a clickable object
          if (object && object.userData && object.userData.clickable) {
            handlePartClick(object);
            break;
          }
        }
      }
    } else {
      // Reset last pointer button state when not pressed
      if (lastPointer.current.buttons !== 0) {
        lastPointer.current.buttons = 0;
      }
    }
  });
  
  return (
    <group 
      onClick={(e) => {
        // Direct click handling for immediate feedback
        if (e.object && e.object.userData && e.object.userData.clickable) {
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
  useGLTF.preload(require("../../assets/models/Dental_Model_Mobile1.glb"));
} catch (error) {
  console.error("Error preloading model:", error);
}

export default SimpleModel;
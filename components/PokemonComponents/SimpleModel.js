import React, { useState, useRef, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei/native";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from 'three';
import { Asset } from 'expo-asset';

function SimpleModel({ 
  onLoad, 
  onRefsUpdate, 
  onClickStatesUpdate, 
  clickStates: externalClickStates, 
  colorMode, // Add this prop
  onTeethClick // Add this prop
}) {
  // Load the model - ensure path is correct for Expo asset
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
  
  // OPTIMIZATION: Pre-create and cache ALL materials upfront
  const materialCache = useRef({
    red: null,
    blue: null,
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
  
  // OPTIMIZATION: Use direct material references instead of cloning for faster swapping
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
    
    // Pre-create materials for each quadrant
    for (let quadrant = 1; quadrant <= 4; quadrant++) {
      materialCache.current.byQuadrant.set(quadrant, {
        red: materialCache.current.red,  // OPTIMIZATION: Use direct reference instead of clone
        blue: materialCache.current.blue // OPTIMIZATION: Use direct reference instead of clone
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
      
      // OPTIMIZATION: Process all objects in a single traversal to reduce overhead
      scene.traverse((object) => {
        if (!object.isMesh) return;
        
        // Store original material for all meshes
        if (object.material) {
          // Store a clone of the original material
          const originalMaterial = object.material; // OPTIMIZATION: Use direct reference
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
            
            // Mark as clickable with mouseover for faster response
            object.userData.clickable = true;
            object.userData.quadrant = quadrant;
            
            // Use pre-created quadrant-specific materials
            const redMaterial = materialCache.current.red;
            const blueMaterial = materialCache.current.blue;
            
            // Store the pre-created materials for this tooth
            materialMaps.set(object.uuid, {
              red: redMaterial,
              blue: blueMaterial,
              original: originalMaterial
            });
            
            // OPTIMIZATION: Apply any existing color state immediately
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
      
      // OPTIMIZATION: Group resetOperation by quadrant
      // Reset by quadrant for better performance
      for (let quadrant = 1; quadrant <= 4; quadrant++) {
        const meshes = materialCache.current.quadrantMeshes[quadrant] || [];
        meshes.forEach(mesh => {
          if (mesh) {
            const materials = materialCache.current.maps.get(mesh.uuid);
            if (materials && materials.original) {
              // Directly set material without checking current state
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
  
  // MODIFIED: Faster material swapping with 3-state cycle (original → red → blue → original)
  // OPTIMIZATION: Simplified with direct material assignment
// Modify the handlePartClick method in SimpleModel.js
const handlePartClick = (mesh) => {
  if (!mesh || !initialized.current) return;
  
  const id = mesh.uuid;
  
  // Get the pre-created materials for this tooth
  const materials = materialCache.current.maps.get(id);
  if (!materials) return;
  
  // Use the passed colorMode prop
  const currentColorMode = colorMode; // No more 'props'
  
  // Set material directly based on current color mode
  mesh.material = currentColorMode === 'red' 
    ? materials.red 
    : materials.blue;
  
  // Update internal ref state immediately
  clickStatesRef.current[id] = currentColorMode;
  
  // OPTIMIZATION: Update React state without RAF for immediate feedback
  const newState = { ...clickStatesRef.current };
  setClickStates(newState);
  
  // Notify parent to open diagnosis modal
  if (onTeethClick) {
    onTeethClick(mesh);
  }
};
 
  
  // OPTIMIZATION: Improved raycasting system with direct hit testing
  const lastRaycastTime = useRef(0);
  const raycastThrottle = 8; // OPTIMIZATION: More frequent raycasts (8ms = ~120fps)
  
  // OPTIMIZATION: More efficient raycasting with optimized event handling
  useFrame((state) => {
    // Skip if not initialized
    if (!initialized.current || !sceneRef.current) return;
    
    // Check if any pointer is down
    if (state.pointer.buttons > 0 && state.events.connected) {
      const now = performance.now();
      
      // OPTIMIZATION: Reduced movement threshold for faster response
      const pointerMoved = 
        Math.abs(state.pointer.x - lastPointer.current.x) > 0.001 || 
        Math.abs(state.pointer.y - lastPointer.current.y) > 0.001 ||
        state.pointer.buttons !== lastPointer.current.buttons;
      
      // OPTIMIZATION: More responsive raycasting (120fps instead of 60fps)
      const shouldPerformRaycast = pointerMoved || (now - lastRaycastTime.current > raycastThrottle);
      
      if (shouldPerformRaycast) {
        // Update last pointer position
        lastPointer.current = { 
          x: state.pointer.x, 
          y: state.pointer.y, 
          buttons: state.pointer.buttons 
        };
        
        lastRaycastTime.current = now;
        
        // OPTIMIZATION: Direct raycast against scene
        const intersects = state.raycaster.intersectObject(sceneRef.current, true);
        
        // Process the first hit only for better performance
        if (intersects.length > 0) {
          const object = intersects[0].object;
          
          // Check if this is a clickable object
          if (object && object.userData && object.userData.clickable) {
            handlePartClick(object);
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

// OPTIMIZATION: Preload the model to improve performance
try {
  // Ensure this path matches your project structure
  useGLTF.preload(Asset.fromModule(require("../../assets/models/Dental_Model_Mobile1.glb")).uri);
} catch (error) {
  console.error("Error preloading model:", error);
}

export default SimpleModel;
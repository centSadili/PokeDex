import React, { Suspense, useState, useCallback, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from "react-native";
import { Vector3 } from "three";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import SimpleModel component
import SimpleModel from "./SimpleModel"; // Make sure this path is correct
import { TeethSelectionControls, processTeethSelections } from "./TeethSelectionHandler";
import TeethConfirmationModal from "./TeethConfirmationModal"; // Import the confirmation modal

// Pre-create rotation step constant for better performance
const ROTATION_STEP = Math.PI / 36; // 5 degrees in radians
const MIN_ELEVATION = 0.1;
const MAX_ELEVATION = Math.PI - 0.1;
const MIN_RADIUS = 1;
const RADIUS_STEP = 0.5;

// Camera controller component - handles the orbit camera functionality
// Optimized with useMemo to prevent unnecessary calculations
function OrbitCameraController({ azimuth, elevation, radius }) {
  const { camera } = useThree();
  
  // Memoize position calculation
  const position = useMemo(() => {
    // Convert spherical to Cartesian coordinates
    const x = radius * Math.sin(elevation) * Math.cos(azimuth);
    const y = radius * Math.cos(elevation);
    const z = radius * Math.sin(elevation) * Math.sin(azimuth);
    return [x, y, z];
  }, [azimuth, elevation, radius]);

  useFrame(() => {
    camera.position.set(...position);
    camera.lookAt(new Vector3(0, 0, 0));
  });

  return null;
}

// Memoized loading indicator component for Suspense fallback
const LoadingIndicator = React.memo(() => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.loadingText}>Loading dental model...</Text>
    </View>
  );
});

// Error component - extracted and memoized for performance
const ErrorDisplay = React.memo(({ error, onRetry }) => {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Error: {error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={onRetry}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
});

// Memoized control button component for reuse
const ControlButton = React.memo(({ onPress, style, text }) => (
  <TouchableOpacity onPressIn={onPress} style={style}>
    <Text style={styles.btnText}>{text}</Text>
  </TouchableOpacity>
));

export default function TeethModelViewer() {
  const [azimuth, setAzimuth] = useState(0); // Horizontal rotation
  const [elevation, setElevation] = useState(Math.PI / 4); // Vertical angle
  const [radius, setRadius] = useState(5); // Camera distance (zoom)
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  // Track clicked teeth - with optimized state updates
  const [clickStates, setClickStates] = useState({});
  // Reference to interactive parts in SimpleModel
  const interactiveRefs = useRef({});
  
  // Track last update time to throttle camera movements
  const lastUpdateTime = useRef(0);
  
  // State for confirmation modal
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [currentSelections, setCurrentSelections] = useState(null);

  // This function rotates the camera based on direction (including diagonals)
  // Optimized with throttling to prevent excessive updates
  const rotateCamera = useCallback((direction) => {
    const now = performance.now();
    // Throttle updates to 60fps (approximately 16ms between frames)
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;

    switch (direction) {
      case "right":
        setAzimuth((prev) => prev - ROTATION_STEP);
        break;
      case "left":
        setAzimuth((prev) => prev + ROTATION_STEP);
        break;
      case "up":
        setElevation((prev) => Math.max(MIN_ELEVATION, prev - ROTATION_STEP));
        break;
      case "down":
        setElevation((prev) => Math.min(MAX_ELEVATION, prev + ROTATION_STEP));
        break;
      // Diagonal directions
      case "up-left":
        setAzimuth((prev) => prev + ROTATION_STEP);
        setElevation((prev) => Math.max(MIN_ELEVATION, prev - ROTATION_STEP));
        break;
      case "up-right":
        setAzimuth((prev) => prev - ROTATION_STEP);
        setElevation((prev) => Math.max(MIN_ELEVATION, prev - ROTATION_STEP));
        break;
      case "down-left":
        setAzimuth((prev) => prev + ROTATION_STEP);
        setElevation((prev) => Math.min(MAX_ELEVATION, prev + ROTATION_STEP));
        break;
      case "down-right":
        setAzimuth((prev) => prev - ROTATION_STEP);
        setElevation((prev) => Math.min(MAX_ELEVATION, prev + ROTATION_STEP));
        break;
    }
  }, []);

  // Zoom functions - optimized with requestAnimationFrame
  const zoomIn = useCallback(() => {
    const now = performance.now();
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;
    
    requestAnimationFrame(() => {
      setRadius((prev) => Math.max(MIN_RADIUS, prev - RADIUS_STEP));
    });
  }, []);
  
  const zoomOut = useCallback(() => {
    const now = performance.now();
    if (now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;
    
    requestAnimationFrame(() => {
      setRadius((prev) => prev + RADIUS_STEP);
    });
  }, []);

  // Function to handle model load completion
  const handleModelLoaded = useCallback(() => {
    setModelLoaded(true);
    console.log("Model loaded successfully");
  }, []);

  // Function to handle errors
  const handleError = useCallback((err) => {
    console.error("Error in 3D View:", err);
    setError(err.message || "Failed to load 3D model");
  }, []);

  // Store references to interactive parts from SimpleModel
  const handleRefsUpdate = useCallback((refs) => {
    interactiveRefs.current = refs;
  }, []);

  // Handle click states update from SimpleModel - with performance optimization
  const handleClickStatesUpdate = useCallback((states) => {
    // Use functional update to prevent stale closures
    setClickStates(states);
  }, []);

  // Reset all teeth to original color - with performance optimization
  const handleReset = useCallback(() => {
    // Create an empty object for new states immediately
    const newStates = {};
    
    // Use requestAnimationFrame for better performance with visual updates
    requestAnimationFrame(() => {
      // Reset the clickStates first for immediate UI feedback
      setClickStates(newStates);
      
      // Alert after a slight delay to let the UI update first
      setTimeout(() => {
        Alert.alert("Reset Complete", "All teeth have been reset to their original colors.");
      }, 50);
    });
  }, []);

  // Initial handler for "Done" button - calculates selections and shows modal
  const handleSelectionDone = useCallback((selections) => {
    // Store the selections for the confirmation modal
    setCurrentSelections(selections);
    // Show the confirmation modal
    setConfirmModalVisible(true);
  }, []);

  // Handle confirm button in modal - save the selections
  const handleConfirmSelections = useCallback(async () => {
    if (!currentSelections) return;
    
    try {
      // Store selections in AsyncStorage
      await AsyncStorage.setItem('teethSelections', JSON.stringify(currentSelections));
      
      // Hide the modal
      setConfirmModalVisible(false);
      
      // Show success message
      Alert.alert(
        "Selections Saved",
        "Your teeth selections have been saved successfully.",
        [{ text: "OK" }]
      );
      
      // You can add navigation here to move to next screen
      // navigation.navigate('NextScreen', { selections: currentSelections });
      
      console.log("Saved teeth selections:", currentSelections);
    } catch (e) {
      console.error("Error saving teeth selections:", e);
      Alert.alert("Error", "Failed to save teeth selections. Please try again.");
    }
  }, [currentSelections]);

  // Handle cancel button in modal
  const handleCancelSelections = useCallback(() => {
    setConfirmModalVisible(false);
    setCurrentSelections(null);
  }, []);

  // Handle edit button in modal - just close the modal to return to editing
  const handleEditSelections = useCallback(() => {
    setConfirmModalVisible(false);
    // Keep currentSelections for when they finish editing
  }, []);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    setError(null);
    setModelLoaded(false);
    // This forces a re-render which will reload the model
  }, []);

  // Memoize Instructions component to prevent unnecessary re-renders
  const Instructions = useMemo(() => (
    <View style={styles.instructions}>
      <Text style={styles.instructionText}>
        Tap on teeth to select (red → blue → black → original). Press Done when finished.
      </Text>
    </View>
  ), []);

  // Memoize Control UI components
  const Controls = useMemo(() => (
    <View style={styles.controls}>
      {/* Enhanced D-pad for rotation with diagonals */}
      <View style={styles.dpad}>
        {/* Top row with up-left, up, up-right */}
        <View style={styles.horizontal}>
          <ControlButton 
            onPress={() => rotateCamera("up-left")} 
            style={styles.diagonalBtn} 
            text="↖" 
          />
          <ControlButton 
            onPress={() => rotateCamera("up")} 
            style={styles.btn} 
            text="↑" 
          />
          <ControlButton 
            onPress={() => rotateCamera("up-right")} 
            style={styles.diagonalBtn} 
            text="↗" 
          />
        </View>
        
        {/* Middle row with left, center, right */}
        <View style={styles.horizontal}>
          <ControlButton 
            onPress={() => rotateCamera("left")} 
            style={styles.btn} 
            text="←" 
          />
          <View style={styles.centerBtn} />
          <ControlButton 
            onPress={() => rotateCamera("right")} 
            style={styles.btn} 
            text="→" 
          />
        </View>
        
        {/* Bottom row with down-left, down, down-right */}
        <View style={styles.horizontal}>
          <ControlButton 
            onPress={() => rotateCamera("down-left")} 
            style={styles.diagonalBtn} 
            text="↙" 
          />
          <ControlButton 
            onPress={() => rotateCamera("down")} 
            style={styles.btn} 
            text="↓" 
          />
          <ControlButton 
            onPress={() => rotateCamera("down-right")} 
            style={styles.diagonalBtn} 
            text="↘" 
          />
        </View>
      </View>

      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <ControlButton 
          onPress={zoomIn} 
          style={styles.zoomBtn} 
          text="+" 
        />
        <ControlButton 
          onPress={zoomOut} 
          style={styles.zoomBtn} 
          text="-" 
        />
      </View>
    </View>
  ), [rotateCamera, zoomIn, zoomOut]);

  return (
    <View style={styles.container}>
      {/* Canvas for 3D Model - with optimized props */}
      <Canvas 
        style={styles.canvas}
        frameloop="demand" // Only render when needed
        onCreated={({ gl }) => {
          console.log("Canvas created successfully");
          // Enable optimizations for WebGL renderer
          gl.setPixelRatio(window.devicePixelRatio);
        }}
        onError={handleError}
      >
        {/* Lighting - optimized and memoized */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 5]} intensity={1} />
        <spotLight position={[0, 5, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
        
        {/* Camera Controller - with memoized values */}
        <OrbitCameraController azimuth={azimuth} elevation={elevation} radius={radius} />
        
        {/* 3D Model - with performance optimized callback props */}
        <Suspense fallback={null}>
          <SimpleModel 
            onLoad={handleModelLoaded} 
            onRefsUpdate={handleRefsUpdate}
            onClickStatesUpdate={handleClickStatesUpdate}
            clickStates={clickStates}
          />
        </Suspense>
      </Canvas>

      {/* Loading indicator - memoized component */}
      {!modelLoaded && !error && <LoadingIndicator />}
      
      {/* Error message - memoized component */}
      {error && <ErrorDisplay error={error} onRetry={handleRetry} />}

      {/* Selection Controls (Reset and Done buttons) - optimized with memoization */}
      {modelLoaded && !error && (
        <TeethSelectionControls 
          clickStates={clickStates}
          interactiveRefs={interactiveRefs}
          onReset={handleReset}
          onDone={handleSelectionDone}
        />
      )}

      {/* UI controls outside the Canvas - memoized */}
      {Controls}

      {/* Instructions - memoized */}
      {Instructions}
      
      {/* Confirmation Modal */}
      <TeethConfirmationModal
        visible={confirmModalVisible}
        selections={currentSelections || {}}
        onConfirm={handleConfirmSelections}
        onCancel={handleCancelSelections}
        onEdit={handleEditSelections}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  controls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  dpad: {
    alignItems: "center",
    justifyContent: "center",
  },
  horizontal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  centerBtn: {
    width: 40,
    height: 40,
  },
  btn: {
    backgroundColor: "rgba(200, 200, 200, 0.8)",
    padding: 15,
    margin: 5,
    borderRadius: 10,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  diagonalBtn: {
    backgroundColor: "rgba(180, 180, 180, 0.8)",
    padding: 12,
    margin: 5,
    borderRadius: 10,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  zoomControls: {
    justifyContent: "center",
  },
  zoomBtn: {
    backgroundColor: "rgba(200, 200, 200, 0.8)",
    padding: 15,
    margin: 5,
    borderRadius: 10,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  instructions: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 10,
  },
  instructionText: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  errorText: {
    color: "red",
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
    padding: 10,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
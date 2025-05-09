import React, { Suspense, useState, useCallback, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from "react-native";
import { Vector3 } from "three";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import SimpleModel component
import SimpleModel from "./SimpleModel"; // Make sure this path is correct
import { TeethSelectionControls } from "./TeethSelectionHandler";

// Camera controller component - handles the orbit camera functionality
function OrbitCameraController({ azimuth, elevation, radius }) {
  const { camera } = useThree();

  useFrame(() => {
    // Convert spherical to Cartesian coordinates
    const x = radius * Math.sin(elevation) * Math.cos(azimuth);
    const y = radius * Math.cos(elevation);
    const z = radius * Math.sin(elevation) * Math.sin(azimuth);

    camera.position.set(x, y, z);
    camera.lookAt(new Vector3(0, 0, 0));
  });

  return null;
}

// Loading indicator component for Suspense fallback
function LoadingIndicator() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.loadingText}>Loading dental model...</Text>
    </View>
  );
}

export default function TeethModelViewer() {
  const [azimuth, setAzimuth] = useState(0); // Horizontal rotation
  const [elevation, setElevation] = useState(Math.PI / 4); // Vertical angle
  const [radius, setRadius] = useState(5); // Camera distance (zoom)
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  // Track clicked teeth
  const [clickStates, setClickStates] = useState({});
  // Reference to interactive parts in SimpleModel
  const interactiveRefs = useRef({});

  // This function rotates the camera based on direction (left, right, up, down)
  const rotateCamera = (direction) => {
    const step = Math.PI / 36; // 5 degrees in radians

    switch (direction) {
      case "right":
        setAzimuth((prev) => prev - step); // Rotate left
        break;
      case "left":
        setAzimuth((prev) => prev + step); // Rotate right
        break;
      case "up":
        setElevation((prev) => Math.max(0.1, prev - step)); // Rotate up (limit the range to avoid inversion)
        break;
      case "down":
        setElevation((prev) => Math.min(Math.PI - 0.1, prev + step)); // Rotate down (limit the range to avoid inversion)
        break;
    }
  };

  // Zoom functions (in and out)
  const zoomIn = () => setRadius((prev) => Math.max(1, prev - 0.5)); // Limit to minimum radius
  const zoomOut = () => setRadius((prev) => prev + 0.5); // Increase radius

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

  // Handle click states update from SimpleModel
  const handleClickStatesUpdate = useCallback((states) => {
    setClickStates(states);
  }, []);

  // Reset all teeth to original color
  const handleReset = useCallback(() => {
    // Create an empty object for new states
    const newStates = {};
    
    // Reset each interactive part in the scene
    Object.values(interactiveRefs.current).forEach(mesh => {
      if (mesh && mesh.material && mesh.userData && mesh.userData.originalColor) {
        mesh.material.color.copy(mesh.userData.originalColor);
      }
    });
    
    // Reset the clickStates
    setClickStates(newStates);
    
    Alert.alert("Reset Complete", "All teeth have been reset to their original colors.");
  }, []);

  // Handle "Done" button press - save selected teeth
  const handleSelectionDone = useCallback(async (selections) => {
    try {
      // Store selections in AsyncStorage
      await AsyncStorage.setItem('teethSelections', JSON.stringify(selections));
      
      Alert.alert(
        "Selections Saved",
        `Red teeth: ${selections.red.join(', ')}\nBlue teeth: ${selections.blue.join(', ')}`,
        [{ text: "OK" }]
      );
      
      // You can add navigation here to move to next screen
      // navigation.navigate('NextScreen', { selections });
      
      console.log("Saved teeth selections:", selections);
    } catch (e) {
      console.error("Error saving teeth selections:", e);
      Alert.alert("Error", "Failed to save teeth selections. Please try again.");
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Canvas for 3D Model */}
      <Canvas 
        style={styles.canvas}
        onCreated={({ gl }) => {
          console.log("Canvas created successfully");
        }}
        onError={handleError}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 5]} intensity={1} />
        <spotLight position={[0, 5, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
        
        {/* Camera Controller */}
        <OrbitCameraController azimuth={azimuth} elevation={elevation} radius={radius} />
        
        {/* 3D Model */}
        <Suspense fallback={null}>
          <SimpleModel 
            onLoad={handleModelLoaded} 
            onRefsUpdate={handleRefsUpdate}
            onClickStatesUpdate={handleClickStatesUpdate}
            clickStates={clickStates}
          />
        </Suspense>
      </Canvas>

      {/* Loading indicator */}
      {!modelLoaded && !error && <LoadingIndicator />}
      
      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setModelLoaded(false);
              // This forces a re-render which will reload the model
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selection Controls (Reset and Done buttons) */}
      {modelLoaded && !error && (
        <TeethSelectionControls 
          clickStates={clickStates}
          interactiveRefs={interactiveRefs}
          onReset={handleReset}
          onDone={handleSelectionDone}
        />
      )}

      {/* UI controls outside the Canvas */}
      <View style={styles.controls}>
        {/* D-pad for rotation */}
        <View style={styles.dpad}>
          <TouchableOpacity
            onPressIn={() => rotateCamera("up")}
            style={styles.btn}
          >
            <Text style={styles.btnText}>↑</Text>
          </TouchableOpacity>
          <View style={styles.horizontal}>
            <TouchableOpacity
              onPressIn={() => rotateCamera("left")}
              style={styles.btn}
            >
              <Text style={styles.btnText}>←</Text>
            </TouchableOpacity>
            <View style={styles.centerBtn} />
            <TouchableOpacity
              onPressIn={() => rotateCamera("right")}
              style={styles.btn}
            >
              <Text style={styles.btnText}>→</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPressIn={() => rotateCamera("down")}
            style={styles.btn}
          >
            <Text style={styles.btnText}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={zoomIn} style={styles.zoomBtn}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={zoomOut} style={styles.zoomBtn}>
            <Text style={styles.btnText}>-</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Tap on teeth to select (red → blue → original). Press Done when finished.
        </Text>
      </View>
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
  },
  horizontal: {
    flexDirection: "row",
    alignItems: "center",
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
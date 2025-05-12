import React, { Suspense, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from "react-native";
import { Vector3 } from "three";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import components
import SimpleModel from "./SimpleModel";
import { TeethSelectionControls } from "./TeethSelectionHandler";
import TeethConfirmationModal from "./TeethConfirmationModal";
import DiagnosisSelectionModal from "./DiagnosisSelectionModal";
import TeethDiagnosisSummary, { processTeethSelections } from "./TeethDiagnosisManager";
import ColorSelectionPanel from "./ColorSelectionPanel";

// Pre-create rotation step constant for better performance
const ROTATION_STEP = Math.PI / 36; // 5 degrees in radians
const MIN_ELEVATION = 0.1;
const MAX_ELEVATION = Math.PI - 0.1;
const MIN_RADIUS = 1;
const RADIUS_STEP = 0.5;

// Camera controller component - handles the orbit camera functionality
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
  const [lastClickedTooth, setLastClickedTooth] = useState(null);
  const [showDiagnosisSummary, setShowDiagnosisSummary] = useState(false);


  
  // Track clicked teeth - with optimized state updates
  const [clickStates, setClickStates] = useState({});
  // Reference to interactive parts in SimpleModel
  const interactiveRefs = useRef({});
  
  // Track last update time to throttle camera movements
  const lastUpdateTime = useRef(0);
  
  // State for confirmation modal
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [currentSelections, setCurrentSelections] = useState(null);

  // State for diagnosis modal
  const [diagnosisModalVisible, setDiagnosisModalVisible] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState({});
  const [selectedColorMode, setSelectedColorMode] = useState('red'); // Default to red
  
  // State for tracking diagnosis data
  const [diagnosisData, setDiagnosisData] = useState({});

  // Effect to load saved diagnosis data on component mount
  useEffect(() => {
    const loadSavedDiagnosis = async () => {
      try {
        const savedData = await AsyncStorage.getItem('teethDiagnosis');
        if (savedData) {
          setDiagnosisData(JSON.parse(savedData));
          console.log("Loaded saved diagnosis data");
        }
      } catch (e) {
        console.error("Error loading saved diagnosis data:", e);
      }
    };
    
    loadSavedDiagnosis();
  }, []);

  useEffect(() => {
    const initializeAppData = async () => {
      try {
        // Optional: You can add a timestamp or version to manage resets
        const lastResetKey = 'lastAppReset';
        const currentVersion = '1.0'; // Update this when you want a complete reset
        
        const lastReset = await AsyncStorage.getItem(lastResetKey);
        
        if (lastReset !== currentVersion) {
          // Perform complete reset
          await AsyncStorage.removeItem('teethDiagnosis');
          await AsyncStorage.removeItem('teethSelections');
          
          // Set new reset timestamp
          await AsyncStorage.setItem(lastResetKey, currentVersion);
          
          // Reset local state
          setDiagnosisData({});
          setClickStates({});
        } else {
          // Load existing data
          const savedData = await AsyncStorage.getItem('teethDiagnosis');
          if (savedData) {
            setDiagnosisData(JSON.parse(savedData));
          }
        }
      } catch (e) {
        console.error("Error initializing app data:", e);
      }
    };
    
    initializeAppData();
  }, []);

  // This function rotates the camera based on direction (including diagonals)
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

  // Handle click states update from SimpleModel
  const handleClickStatesUpdate = useCallback((states) => {
    // Use functional update to prevent stale closures
    setClickStates(states);
  }, []);

  // Reset all teeth to original color
  const handleReset = useCallback(() => {
    const newStates = {};
    
    requestAnimationFrame(() => {
      // Reset the clickStates first for immediate UI feedback
      setClickStates(newStates);
      // Reset diagnosis data
      setDiagnosisData({});
      
      // Alert after a slight delay to let the UI update first
      setTimeout(() => {
        Alert.alert("Reset Complete", "All teeth have been reset to their original colors and diagnoses.");
      }, 50);
      
      // Clear saved diagnosis data
      AsyncStorage.removeItem('teethDiagnosis');
    });
  }, []);

  // Color selection handler
  const handleColorSelect = useCallback((color) => {
    setSelectedColorMode(color);
    
    // Check if we have teeth currently selected (in clickStates)
    const anySelected = Object.keys(clickStates).length > 0;
    
    if (anySelected) {
      // Process teeth selections
      const { selectedTeeth: processedTeeth } = processTeethSelections(clickStates, interactiveRefs, diagnosisData);
      
      // If we have selections, show the diagnosis modal
      if (Object.keys(processedTeeth).length > 0) {
        setSelectedTeeth(processedTeeth);
        setDiagnosisModalVisible(true);
      } else {
        Alert.alert("No Teeth Selected", "Please select one or more teeth before choosing a diagnosis type.");
      }
    } else {
      Alert.alert("No Teeth Selected", "Please select one or more teeth before choosing a diagnosis type.");
    }
  }, [clickStates, diagnosisData]);

  // Handle diagnosis selection
  const handleDiagnosisSelect = useCallback((diagnosis, colorMode, teeth) => {
    // Create a copy of current diagnosis data
    const updatedDiagnosisData = { ...diagnosisData };
    
    // Update diagnosis data for each selected tooth
    Object.values(teeth).forEach((toothInfo) => {
      const { toothNumber } = toothInfo;
      
      // Add diagnosis to the tooth
      updatedDiagnosisData[toothNumber] = {
        ...diagnosis,
        color: colorMode
      };
    });
    
     // Update state
  setDiagnosisData(updatedDiagnosisData);
  
  // Save to AsyncStorage
  AsyncStorage.setItem('teethDiagnosis', JSON.stringify(updatedDiagnosisData))
    .catch(error => console.error("Error saving diagnosis data:", error));
    
    // Clear teeth selections after assigning diagnosis
    setClickStates({});
  
    // Close the modal
    setDiagnosisModalVisible(false);
  }, [diagnosisData]);

  // Initial handler for "Done" button - calculates selections and shows modal
  const handleSelectionDone = useCallback(() => {
    // Process teeth selections
    const { toothData } = processTeethSelections(clickStates, interactiveRefs, diagnosisData);
    
    // Store the selections for the confirmation modal
    setCurrentSelections(toothData);
    // Show the confirmation modal
    setConfirmModalVisible(true);
  }, [clickStates, diagnosisData]);

  // Handle confirm button in modal - save the selections
  const handleConfirmSelections = useCallback(async () => {
    if (!currentSelections) return;
    
    try {
      // Store selections in AsyncStorage
      await AsyncStorage.setItem('teethSelections', JSON.stringify(currentSelections));
      
      // Hide the modal
      setConfirmModalVisible(false);
      
      // Show the diagnosis summary
      setShowDiagnosisSummary(true);
      
      // Show success message
      Alert.alert(
        "Selections Saved",
        "Your teeth selections have been saved successfully.",
        [{ text: "OK" }]
      );
      
      console.log("Saved teeth selections:", currentSelections);
    } catch (e) {
      console.error("Error saving teeth selections:", e);
      Alert.alert("Error", "Failed to save teeth selections. Please try again.");
    }
  }, [currentSelections]);

  const handleHideDiagnosisSummary = useCallback(() => {
    setShowDiagnosisSummary(false);
  }, []);

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
        Tap on teeth to select. Then use the color panel to assign diagnosis.
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
              colorMode={selectedColorMode}
              onTeethClick={(mesh) => {
                // Process the clicked tooth and immediately open diagnosis modal
                const toothInfo = processTeethSelections(
                  { [mesh.uuid]: selectedColorMode },
                  interactiveRefs,
                  diagnosisData
                );
                
                if (Object.keys(toothInfo.selectedTeeth).length > 0) {
                  setSelectedTeeth(toothInfo.selectedTeeth);
                  setDiagnosisModalVisible(true);
                }
              }}
            />   
        </Suspense>
      </Canvas>

      {/* Loading indicator - memoized component */}
      {!modelLoaded && !error && <LoadingIndicator />}
      
      {/* Error message - memoized component */}
      {error && <ErrorDisplay error={error} onRetry={handleRetry} />}
      
      {/* Color Selection Panel */}
      {modelLoaded && !error && (
        <View style={styles.colorSelectionContainer}>
          <ColorSelectionPanel 
            onSelectColor={handleColorSelect}
            selectedColor={selectedColorMode}
          />
        </View>
      )}
      
      {/* Diagnosis Summary */}
      {modelLoaded && !error && Object.keys(diagnosisData).length > 0 && (
        <View style={styles.diagnosisSummaryContainer}>
          <TeethDiagnosisSummary 
            diagnosisData={diagnosisData}
            onEditTooth={() => {}} // You can implement edit functionality if needed
          />
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

      {showDiagnosisSummary && (
        <View style={styles.diagnosisSummaryContainer}>
          <View style={styles.diagnosisSummaryHeader}>
            <Text style={styles.diagnosisSummaryTitle}>Diagnosis Summary</Text>
            <TouchableOpacity 
              onPress={handleHideDiagnosisSummary}
              style={styles.closeSummaryButton}
            >
              <Text style={styles.closeSummaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <TeethDiagnosisSummary 
            diagnosisData={diagnosisData}
            onEditTooth={() => {}} // You can implement edit functionality if needed
          />
        </View>
      )}

      {/* UI controls outside the Canvas - memoized */}
      {Controls}

      {/* Instructions - memoized */}
      {Instructions}
      
      {/* Diagnosis Selection Modal */}
      <DiagnosisSelectionModal
        visible={diagnosisModalVisible}
        onClose={() => setDiagnosisModalVisible(false)}
        onSelect={handleDiagnosisSelect}
        selectedTeeth={selectedTeeth}
        colorMode={selectedColorMode}
      />
      
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
  colorSelectionContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 80, // Position below instructions
  },
  diagnosisSummaryContainer: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    maxHeight: 200,
  },
  diagnosisSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  diagnosisSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeSummaryButton: {
    padding: 10,
  },
  closeSummaryButtonText: {
    color: '#666',
  },
});
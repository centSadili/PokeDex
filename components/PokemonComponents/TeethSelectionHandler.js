import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";

// Memoized tooth name extraction function for better performance
const getBaseToothName = (fullName) => fullName.split('_')[0];

// Cache for tooth name lookups to avoid repetitive operations
const toothNameCache = {};

// OPTIMIZATION: WeakMap for faster lookup without garbage collection issues
const meshToNameMap = new WeakMap();

// OPTIMIZATION: Improved tooth name finding with WeakMap and direct lookup
const findToothNameByUuid = (uuid, interactiveParts) => {
  for (const [name, ref] of Object.entries(interactiveParts)) {
    if (!ref) continue;
    
    // Use WeakMap for cached lookups
    let cachedName = meshToNameMap.get(ref);
    if (cachedName) return cachedName;
    
    // Direct UUID comparison for faster performance
    if (ref.uuid === uuid) {
      meshToNameMap.set(ref, name);
      return name;
    }
  }
  return null;
};

// Utility function to group teeth by color state - optimized version
export const processTeethSelections = (clickStates, interactiveParts) => {
  // Use Sets for faster lookup and unique values
  const redTeeth = new Set();
  const blueTeeth = new Set();
  const blackTeeth = new Set(); // NEW: Add set for black (missing) teeth
  const allTeeth = new Set();
  
  // Reset cache if needed (when selections change dramatically)
  if (Object.keys(toothNameCache).length > 1000) {
    Object.keys(toothNameCache).forEach(key => {
      delete toothNameCache[key];
    });
  }

  // OPTIMIZATION: Faster processing with direct object iterations
  Object.entries(clickStates).forEach(([uuid, color]) => {
    // Get tooth name from cache or find it
    let toothName = toothNameCache[uuid];
    
    if (!toothName) {
      toothName = findToothNameByUuid(uuid, interactiveParts);
      if (toothName) {
        // Cache for future lookups
        toothNameCache[uuid] = toothName;
      }
    }
    
    if (toothName) {
      // Extract the base tooth number and add to appropriate set
      const baseToothName = getBaseToothName(toothName);
      allTeeth.add(baseToothName);
      
      if (color === "red") {
        redTeeth.add(baseToothName);
      } else if (color === "blue") {
        blueTeeth.add(baseToothName);
      } else if (color === "black") { // NEW: Add black teeth to the set
        blackTeeth.add(baseToothName);
      }
    }
  });

  // Find unselected teeth by getting names from interactive parts
  const unselectedTeeth = new Set();
  
  // OPTIMIZATION: Process interactive parts once with a cached set of base names
  const processedBaseNames = new Set();
  
  for (const partName of Object.keys(interactiveParts)) {
    const baseToothName = getBaseToothName(partName);
    
    // Skip if we've already processed this base name
    if (processedBaseNames.has(baseToothName)) continue;
    processedBaseNames.add(baseToothName);
    
    // Add to unselected if not already in red, blue, or black
    if (!redTeeth.has(baseToothName) && !blueTeeth.has(baseToothName) && !blackTeeth.has(baseToothName)) {
      unselectedTeeth.add(baseToothName);
    }
  }

  // Convert sets to sorted arrays for consistent output
  return {
    red: [...redTeeth].sort(),
    blue: [...blueTeeth].sort(),
    black: [...blackTeeth].sort(), // NEW: Add black teeth to the return object
    unselected: [...unselectedTeeth].sort()
  };
};

// OPTIMIZATION: Pure component for better performance
const PureButton = React.memo(({ onPress, style, text, disabled }) => (
  <TouchableOpacity 
    style={style} 
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
));

// Component to add to TeethModelViewer - optimized with performance improvements
export const TeethSelectionControls = ({ 
  clickStates, 
  interactiveRefs, 
  onReset, 
  onDone 
}) => {
  // Debounce tooth processing to reduce unnecessary calculations
  const [isProcessing, setIsProcessing] = useState(false);
  const processingTimeoutRef = useRef(null);
  
  // OPTIMIZATION: Immediate reset without state processing
  const handleReset = () => {
    if (isProcessing) return;
    if (onReset && typeof onReset === 'function') {
      onReset();
    }
  };
  
  // Handler with debouncing
  const handleDone = () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // OPTIMIZATION: Use direct callback instead of requestAnimationFrame
    // This makes the processing start immediately
    try {
      const selections = processTeethSelections(clickStates, interactiveRefs.current);
      
      if (onDone && typeof onDone === 'function') {
        onDone(selections);
      } else {
        // Default behavior if no callback provided
        Alert.alert(
          "Selections Saved",
          `Red teeth: ${selections.red.join(', ')}\nBlue teeth: ${selections.blue.join(', ')}\nBlack teeth: ${selections.black.join(', ')}`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error processing selections:", error);
      Alert.alert("Error", "Failed to process teeth selections.");
    } finally {
      // Reset processing flag after delay
      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
      }, 300);
    }
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);
  
  // Memoize the component to prevent unnecessary re-renders
  return useMemo(() => (
    <View style={styles.selectionControls}>
      <PureButton 
        style={styles.resetButton} 
        onPress={handleReset}
        text="Reset"
        disabled={isProcessing}
      />
      
      <PureButton 
        style={[
          styles.doneButton,
          isProcessing && styles.disabledButton
        ]} 
        onPress={handleDone}
        text={isProcessing ? "Processing..." : "Done"}
        disabled={isProcessing}
      />
    </View>
  ), [onReset, handleDone, isProcessing]);
};

const styles = StyleSheet.create({
  selectionControls: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "column",
  },
  resetButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
    width: 80,
    elevation: 3, // Add shadow on Android
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: 80,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: "#A5D6A7", // lighter green
    opacity: 0.8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
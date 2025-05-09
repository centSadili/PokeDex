import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";

// Utility function to group teeth by color state
export const processTeethSelections = (clickStates, interactiveParts) => {
  const selections = {
    red: [],
    blue: [],
    unselected: []
  };

  // Convert from UUID keys to tooth names
  Object.entries(clickStates).forEach(([uuid, color]) => {
    // Find the tooth name associated with this UUID
    const toothName = findToothNameByUuid(uuid, interactiveParts);
    if (toothName) {
      // Extract the base tooth number (e.g., "T11" from "T11_labial")
      const baseToothName = toothName.split('_')[0];
      
      // Add to appropriate color group if not already there
      if (color === "red" && !selections.red.includes(baseToothName)) {
        selections.red.push(baseToothName);
      } else if (color === "blue" && !selections.blue.includes(baseToothName)) {
        selections.blue.push(baseToothName);
      }
    }
  });

  // Find unselected teeth
  for (const partName of Object.keys(interactiveParts)) {
    const baseToothName = partName.split('_')[0];
    if (
      !selections.red.includes(baseToothName) && 
      !selections.blue.includes(baseToothName) &&
      !selections.unselected.includes(baseToothName)
    ) {
      selections.unselected.push(baseToothName);
    }
  }

  return selections;
};

// Helper function to find tooth name from UUID
const findToothNameByUuid = (uuid, interactiveParts) => {
  for (const [name, ref] of Object.entries(interactiveParts)) {
    if (ref && ref.uuid === uuid) {
      return name;
    }
  }
  return null;
};

// Component to add to TeethModelViewer
export const TeethSelectionControls = ({ 
  clickStates, 
  interactiveRefs, 
  onReset, 
  onDone 
}) => {
  const handleDone = () => {
    const selections = processTeethSelections(clickStates, interactiveRefs.current);
    
    if (onDone && typeof onDone === 'function') {
      onDone(selections);
    } else {
      // Default behavior if no callback provided
      Alert.alert(
        "Selections Saved",
        `Red teeth: ${selections.red.join(', ')}\nBlue teeth: ${selections.blue.join(', ')}`,
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.selectionControls}>
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={onReset}
      >
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.doneButton} 
        onPress={handleDone}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
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
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: 80,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
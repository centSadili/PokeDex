import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

// Helper function to process tooth selections
export function processTeethSelections(clickStates, interactiveRefs, existingDiagnosisData = {}) {
  const selectedTeeth = {};
  const toothData = {};

  // Iterate through clicked states
  Object.keys(clickStates).forEach(uuid => {
    // Find the corresponding mesh for this UUID
    const matchingMesh = Object.values(interactiveRefs.current).find(
      mesh => mesh.uuid === uuid
    );

    if (matchingMesh) {
      // Extract tooth number and part from mesh name
      const nameParts = matchingMesh.name.split('_');
      const toothNumber = nameParts[0];
      const toothSurface = nameParts[1];

      // Create or update tooth entry
      if (!selectedTeeth[toothNumber]) {
        selectedTeeth[toothNumber] = {
          toothNumber,
          surfaces: new Set(),
          existingDiagnosis: existingDiagnosisData[toothNumber] || null
        };
      }

      // Add surface to the tooth
      selectedTeeth[toothNumber].surfaces.add(toothSurface);
    }
  });

  // Convert selectedTeeth to a format suitable for display or further processing
  Object.values(selectedTeeth).forEach(tooth => {
    toothData[tooth.toothNumber] = {
      ...tooth,
      surfaces: Array.from(tooth.surfaces)
    };
  });

  return { selectedTeeth, toothData };
}

// Selection Controls Component
export function TeethSelectionControls({ 
  clickStates, 
  interactiveRefs, 
  onReset, 
  onDone 
}) {
  // Memoize the processed selections to avoid unnecessary re-computations
  const { toothData } = useMemo(() => 
    processTeethSelections(clickStates, interactiveRefs), 
    [clickStates, interactiveRefs]
  );

  // Determine if any teeth are selected
  const hasSelections = Object.keys(toothData).length > 0;

  return (
    <View style={styles.container}>
      {/* Reset Button */}
      <TouchableOpacity 
        style={[
          styles.button, 
          styles.resetButton, 
          hasSelections ? styles.activeButton : styles.inactiveButton
        ]}
        onPress={onReset}
        disabled={!hasSelections}
      >
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>

      {/* Done Button */}
      <TouchableOpacity 
        style={[
          styles.button, 
          styles.doneButton, 
          hasSelections ? styles.activeButton : styles.inactiveButton
        ]}
        onPress={onDone}
        disabled={!hasSelections}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Positioned above the camera controls
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeButton: {
    backgroundColor: '#2196F3',
  },
  inactiveButton: {
    backgroundColor: '#CCCCCC',
  },
  resetButton: {
    backgroundColor: '#F44336', // Red for reset
  },
  doneButton: {
    backgroundColor: '#4CAF50', // Green for done
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Utility to get tooth information from mesh name
const getToothInfo = (meshName) => {
  if (!meshName) return null;
  
  // Extract tooth number and surface
  const parts = meshName.split('_');
  if (parts.length !== 2) return null;
  
  const toothPart = parts[0];
  const surface = parts[1];
  
  // Extract just the tooth number (remove the "T" prefix)
  const toothNumber = toothPart.substring(1);
  
  return {
    toothNumber,
    surface
  };
};

// Process teeth selections to group by tooth
export const processTeethSelections = (clickStates, interactiveRefs, diagnosisData) => {
  const selectedTeeth = {};
  const toothData = {};
  
  // Group selected meshes by tooth number
  Object.entries(clickStates).forEach(([uuid, colorState]) => {
    // Find the mesh reference by UUID
    const meshName = Object.keys(interactiveRefs.current).find(key => 
      interactiveRefs.current[key].uuid === uuid
    );
    
    if (meshName) {
      const info = getToothInfo(meshName);
      if (info) {
        const { toothNumber, surface } = info;
        
        // Initialize tooth data if not exists
        if (!toothData[toothNumber]) {
          toothData[toothNumber] = {
            surfaces: {},
            colors: new Set(),
            diagnosis: null
          };
        }
        
        // Add surface data
        toothData[toothNumber].surfaces[surface] = colorState;
        toothData[toothNumber].colors.add(colorState);
        
        // If this tooth has a diagnosis code from previous selection
        if (diagnosisData && diagnosisData[toothNumber]) {
          toothData[toothNumber].diagnosis = diagnosisData[toothNumber];
        }
        
        // Add to selected teeth by color
        if (!selectedTeeth[uuid]) {
          selectedTeeth[uuid] = {
            uuid,
            meshName,
            toothNumber,
            surface,
            colorState
          };
        }
      }
    }
  });
  
  return {
    selectedTeeth,
    toothData
  };
};

// Component to show diagnosis summary
const TeethDiagnosisSummary = ({ diagnosisData, onEditTooth }) => {
  // Group diagnoses by code for a summary display
  const diagnosisCounts = {};
  
  Object.entries(diagnosisData).forEach(([toothNumber, data]) => {
    const code = data.code;
    if (!diagnosisCounts[code]) {
      diagnosisCounts[code] = {
        count: 0,
        label: data.label,
        color: data.color,
        teeth: []
      };
    }
    
    diagnosisCounts[code].count++;
    diagnosisCounts[code].teeth.push(toothNumber);
  });
  
  // Generate rows for each diagnosis type
  const diagnosisRows = Object.entries(diagnosisCounts).map(([code, data]) => (
    <View key={code} style={styles.diagnosisRow}>
      <View style={[styles.codeIndicator, { backgroundColor: data.color === 'red' ? '#ff5252' : '#2196F3' }]}>
        <Text style={styles.codeText}>{code}</Text>
      </View>
      
      <View style={styles.diagnosisInfo}>
        <Text style={styles.diagnosisLabel}>{data.label}</Text>
        <Text style={styles.teethList}>
          Teeth: {data.teeth.map(t => t.replace('T', '')).join(', ')}
        </Text>
      </View>
      
      <Text style={styles.countText}>{data.count}</Text>
    </View>
  ));
  
  if (Object.keys(diagnosisData).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No diagnoses assigned yet</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Diagnosis Summary</Text>
      <View style={styles.divider} />
      {diagnosisRows}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  diagnosisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  codeIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  codeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  diagnosisInfo: {
    flex: 1,
  },
  diagnosisLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  teethList: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    width: 30,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default TeethDiagnosisSummary;
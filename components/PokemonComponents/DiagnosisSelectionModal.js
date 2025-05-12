import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';

// Diagnosis options with their descriptions
const RED_DIAGNOSES = [
  { code: 'C', label: 'Caries', description: 'Dental decay or cavity' },
  { code: 'F', label: 'Fractured', description: 'Broken tooth structure' },
  { code: 'Imp', label: 'Impacted', description: 'Tooth unable to fully erupt' },
  { code: 'MR', label: 'Missing Restoration', description: 'Lost filling or crown' },
  { code: 'RC', label: 'Recurrent Caries', description: 'New decay around existing restoration' },
  { code: 'RF', label: 'Root Fragment', description: 'Retained root piece' },
  { code: 'X', label: 'Extraction due to Caries', description: 'Needs removal due to decay' },
  { code: 'XO', label: 'Extraction due to Other Causes', description: 'Needs removal for other reasons' },
];

const BLUE_DIAGNOSES = [
  { code: 'Ab', label: 'Abutment', description: 'Support tooth for bridge or denture' },
  { code: 'Am', label: 'Amalgam', description: 'Silver filling material' },
  { code: 'APC', label: 'All Porcelain Crown', description: 'Full ceramic crown' },
  { code: 'Co', label: 'Composite', description: 'Tooth-colored filling material' },
  { code: 'CD', label: 'Complete Denture', description: 'Full replacement of teeth' },
  { code: 'GC', label: 'Gold Crown', description: 'Full gold coverage' },
  { code: 'Gl', label: 'Glass Ionomer', description: 'Fluoride-releasing filling material' },
  { code: 'In', label: 'Inlay', description: 'Custom-made filling' },
  { code: 'M', label: 'Missing', description: 'Tooth not present' },
  { code: 'MC', label: 'Metal Crown', description: 'Full metal coverage' },
  { code: 'P', label: 'Pontic', description: 'Artificial tooth in bridge' },
  { code: 'PFG', label: 'Porcelain Fused to Gold', description: 'Combined material crown' },
  { code: 'PFM', label: 'Porcelain Fused to Metal', description: 'Combined material crown' },
  { code: 'PFS', label: 'Pit and Fissure Sealant', description: 'Preventive coating' },
  { code: 'RPD', label: 'Removable Partial Denture', description: 'Partial teeth replacement' },
  { code: 'SS', label: 'Stainless Steel Crown', description: 'Prefabricated metal crown' },
  { code: 'TF', label: 'Temporary Filling', description: 'Interim restoration' },
  { code: 'Un', label: 'Unerupted', description: 'Tooth not emerged' },
];

const DiagnosisSelectionModal = ({ 
  visible, 
  onClose, 
  onSelect, 
  selectedTeeth, 
  colorMode 
}) => {
  // Local state for selected diagnosis
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  
  const diagnosisList = useMemo(() => {
    return colorMode === 'red' ? RED_DIAGNOSES : BLUE_DIAGNOSES;
  }, [colorMode]);
  
  // Handler for selecting a diagnosis
  const handleSelectDiagnosis = (diagnosis) => {
    setSelectedDiagnosis(diagnosis);
  };
  
  // Handler for confirming the selection
  const handleConfirm = () => {
    if (selectedDiagnosis) {
      onSelect(selectedDiagnosis, colorMode, selectedTeeth);
      setSelectedDiagnosis(null);
      onClose();
    }
  };
  
  // Handler for canceling the selection
  const handleCancel = () => {
    setSelectedDiagnosis(null);
    onClose();
  };
  
  // Helper to generate the title text
  const getTitle = () => {
    const colorText = colorMode === 'red' ? 'Red' : 'Blue';
    const teethCount = Object.keys(selectedTeeth || {}).length;
    return `Select ${colorText} Diagnosis for ${teethCount} ${teethCount === 1 ? 'tooth' : 'teeth'}`;
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>
                {colorMode === 'red' ? 'Pathologies & Treatment Needs' : 'Existing Treatments & Conditions'}
              </Text>
            </View>
            
            <ScrollView style={styles.diagnosisList}>
              {diagnosisList.map((diagnosis) => (
                <TouchableOpacity
                  key={diagnosis.code}
                  style={[
                    styles.diagnosisItem,
                    selectedDiagnosis?.code === diagnosis.code && styles.selectedDiagnosis,
                    { borderLeftColor: colorMode === 'red' ? '#ff5252' : '#2196F3' }
                  ]}
                  onPress={() => handleSelectDiagnosis(diagnosis)}
                >
                  <View style={styles.diagnosisHeader}>
                    <Text style={styles.diagnosisCode}>{diagnosis.code}</Text>
                    <Text style={styles.diagnosisLabel}>{diagnosis.label}</Text>
                  </View>
                  <Text style={styles.diagnosisDescription}>{diagnosis.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: colorMode === 'red' ? '#ff5252' : '#2196F3',
                    opacity: selectedDiagnosis ? 1 : 0.5
                  }
                ]}
                onPress={handleConfirm}
                disabled={!selectedDiagnosis}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  diagnosisList: {
    maxHeight: 400,
  },
  diagnosisItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderLeftWidth: 4,
  },
  selectedDiagnosis: {
    backgroundColor: '#f0f9ff',
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  diagnosisCode: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
    width: 45,
  },
  diagnosisLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  diagnosisDescription: {
    color: '#666',
    fontSize: 14,
    marginLeft: 45,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default DiagnosisSelectionModal;
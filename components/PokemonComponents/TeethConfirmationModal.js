import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

// Constants for color meanings
const COLOR_LABELS = {
  red: 'Damaged',
  blue: 'Restoration',
  black: 'Missing',
};

// A tooth section component to display teeth by category
const TeethSection = ({ title, teeth, color }) => {
  if (!teeth || teeth.length === 0) return null;
  
  return (
    <View style={styles.section}>
      <View style={[styles.colorIndicator, { backgroundColor: color }]} />
      <View style={styles.sectionContent}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.teethList}>{teeth.join(', ')}</Text>
      </View>
    </View>
  );
};

const TeethConfirmationModal = ({ visible, selections, onConfirm, onCancel, onEdit }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirm Teeth Selection</Text>
          
          <ScrollView style={styles.selectionContainer}>
            <TeethSection 
              title={`Damaged Teeth (${selections.red?.length || 0})`} 
              teeth={selections.red} 
              color="red" 
            />
            
            <TeethSection 
              title={`For Restoration Teeth (${selections.blue?.length || 0})`} 
              teeth={selections.blue} 
              color="blue" 
            />
            
            <TeethSection 
              title={`Missing Teeth (${selections.black?.length || 0})`} 
              teeth={selections.black} 
              color="black" 
            />
            
            <TeethSection 
              title={`Normal (${selections.unselected?.length || 0})`} 
              teeth={selections.unselected} 
              color="#CCCCCC" 
            />
          </ScrollView>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Please confirm your selections or go back to edit
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.editButton]} 
                onPress={onEdit}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]} 
                onPress={onConfirm}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  selectionContainer: {
    maxHeight: 400,
    marginBottom: 15,
  },
  section: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
    marginTop: 3,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  teethList: {
    fontSize: 14,
    color: '#555',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FFC107',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TeethConfirmationModal;
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const ColorSelectionPanel = ({ 
  onSelectColor, 
  selectedColor 
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          selectedColor === 'red' 
            ? styles.activeRedButton 
            : styles.activeBlueButton
        ]}
        onPress={() => onSelectColor(selectedColor === 'red' ? 'blue' : 'red')}
>
        <View style={styles.buttonContent}>
          <View 
            style={[
              styles.colorIndicator, 
              { backgroundColor: selectedColor === 'red' ? '#f44336' : '#2196F3' }
            ]} 
          />
          <Text style={styles.buttonText}>
            {selectedColor === 'red' 
              ? 'Pathologies & Treatment Needs' 
              : 'Existing Treatments & Conditions'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  activeRedButton: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  activeBlueButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
  },
});

export default ColorSelectionPanel;
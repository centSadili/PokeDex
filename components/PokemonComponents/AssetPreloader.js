import { Asset } from 'expo-asset';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Preloads and caches 3D models for better performance in Expo
 * This is crucial for offline access in EAS builds
 */
export async function preloadModels() {
  const modelAssets = [
    require("../../assets/models/Dental_Model_Mobile1.glb"),
    // Add any other models you need to preload here
  ];
  
  try {
    // Download all model assets
    const assets = modelAssets.map(module => Asset.fromModule(module));
    const downloadPromises = assets.map(asset => asset.downloadAsync());
    await Promise.all(downloadPromises);
    
    // Make sure the assets are accessible from the file system
    const modelPaths = assets.map(asset => asset.uri);
    
    console.log("All models preloaded successfully:", modelPaths);
    return modelPaths;
  } catch (error) {
    console.error("Error preloading models:", error);
    throw error;
  }
}

/**
 * Verifies model files exist after download
 * Useful for debugging asset loading issues
 */
export async function verifyModelFiles(modelPaths) {
  try {
    const fileChecks = await Promise.all(
      modelPaths.map(async (uri) => {
        // Only check file:// URIs - we can't check remote URIs
        if (uri.startsWith('file://')) {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          return { uri, exists: fileInfo.exists, size: fileInfo.size };
        }
        return { uri, exists: true, size: 'unknown (remote)' };
      })
    );
    
    console.log("Model file verification results:", fileChecks);
    return fileChecks;
  } catch (error) {
    console.error("Error verifying model files:", error);
    return null;
  }
}

/**
 * A component that handles asset preloading with loading UI
 */
export function ModelPreloader({ children, onError }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadAssets = async () => {
      try {
        const modelPaths = await preloadModels();
        await verifyModelFiles(modelPaths);
        
        if (isMounted) {
          setLoaded(true);
        }
      } catch (err) {
        console.error("Asset loading failed:", err);
        if (isMounted) {
          setError(err);
          if (onError) {
            onError(err);
          }
        }
      }
    };
    
    loadAssets();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [onError]);
  
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load 3D assets</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }
  
  if (!loaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading 3D models...</Text>
      </View>
    );
  }
  
  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#c00',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});
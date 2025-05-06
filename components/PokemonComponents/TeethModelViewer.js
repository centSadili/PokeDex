import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Canvas } from "@react-three/fiber/native";
import { useGLTF } from "@react-three/drei/native";
import * as THREE from "three";
import modelPath from "../../assets/models/red_pokemon.glb"; // Adjust the path to your model

// Model Component
const TeethModel = ({ uri }) => {
  const { scene } = useGLTF(uri);

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material.color.set("#ffffff"); // Set to white
          child.material.metalness = 0.2;
          child.material.roughness = 0.8;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [scene]);

  return <primitive object={scene} />;
};

// Main Viewer Component
const TeethModelViewer = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>3D Teeth Model</Text>
      <Canvas style={styles.canvas}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 5]} intensity={1} />
        
          <TeethModel uri={modelPath} />
       
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f0ff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  canvas: {
    width: "100%",
    height: "80%",
  },
});

export default TeethModelViewer;

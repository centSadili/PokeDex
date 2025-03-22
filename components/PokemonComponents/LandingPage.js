import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber/native";
import { useGLTF } from "@react-three/drei/native";
import {
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { Asset } from "expo-asset";
import { useNavigation } from "@react-navigation/native";

const LandingPage = () => {
  const modelPath = Asset.fromModule(
    require("../../assets/models/red_pokemon.glb")
  ).uri;

  function Model(props) {
    const { scene } = useGLTF(modelPath);
    return <primitive object={scene} {...props} />;
  }

  // Reference to the camera position
  const [cameraPosition, setCameraPosition] = useState([1, 2.5, 10]);
  const [rotation, setRotation] = useState(0); // Model rotation state
  const nav = useNavigation();
  // Toggle between two camera angles
  const Home = () => {
    nav.navigate("PokeDex");
  };

  // Rotate model to the left
  const rotateLeft = () => {
    setRotation((prevRotation) => prevRotation - Math.PI / 8); // Rotate left by 22.5 degrees
  };

  // Rotate model to the right
  const rotateRight = () => {
    setRotation((prevRotation) => prevRotation + Math.PI / 8); // Rotate right by 22.5 degrees
  };

  function CameraController({ cameraPosition }) {
    const { camera } = useThree();

    useEffect(() => {
      camera.position.set(...cameraPosition);
      camera.updateProjectionMatrix();
    }, [cameraPosition]);

    return null;
  }

  return (
    <View style={styles.container}>
      <Canvas camera={{ position: cameraPosition, fov: 30 }}>
        {/* Dynamically update camera */}
        <CameraController cameraPosition={cameraPosition} />

        <color attach="background" args={["red"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Suspense fallback={null}>
          {/* Apply rotation to the model */}
          <Model scale={0.02} position={[0, -1, 0]} rotation={[0, rotation, 0]} />
        </Suspense>
      </Canvas>

      {/* Left button */}
      <TouchableOpacity style={[styles.button, styles.leftButton]} onPress={rotateLeft}>
        <Text style={styles.buttonText}>← Left</Text>
      </TouchableOpacity>

      {/* Right button */}
      <TouchableOpacity style={[styles.button, styles.rightButton]} onPress={rotateRight}>
        <Text style={styles.buttonText}>Right →</Text>
      </TouchableOpacity>

      {/* Toggle Camera button */}
      <TouchableOpacity style={[styles.button, styles.centerButton]} onPress={Home}>
        <Text style={styles.buttonText}>Home</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  button: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "#FF4081",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  leftButton: {
    left: 30,
  },
  rightButton: {
    right: 30,
  },
  centerButton: {
    alignSelf: "center",
  },
});

export default LandingPage;

// src/screens/TeethModelViewer.js
import React, { Suspense, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Vector3 } from "three";

// Import SimpleModel from the new file
import SimpleModel from "./SimpleModel"; // Adjust the import path accordingly

function OrbitCameraController({ azimuth, elevation, radius }) {
  const { camera } = useThree();

  useFrame(() => {
    // Convert spherical to Cartesian coordinates
    const x = radius * Math.sin(elevation) * Math.cos(azimuth);
    const y = radius * Math.cos(elevation);
    const z = radius * Math.sin(elevation) * Math.sin(azimuth);

    camera.position.set(x, y, z);
    camera.lookAt(new Vector3(0, 0, 0));
  });

  return null;
}

export default function TeethModelViewer() {
  const [azimuth, setAzimuth] = useState(0); // Horizontal rotation
  const [elevation, setElevation] = useState(Math.PI / 4); // Vertical angle
  const [radius, setRadius] = useState(5); // Camera distance (zoom)

  // This function rotates the camera based on direction (left, right, up, down)
  const rotateCamera = (direction) => {
    const step = Math.PI / 36; // 5 degrees in radians

    switch (direction) {
      case "left":
        setAzimuth((prev) => prev - step); // Rotate left
        break;
      case "right":
        setAzimuth((prev) => prev + step); // Rotate right
        break;
      case "up":
        setElevation((prev) => Math.max(0.1, prev - step)); // Rotate up (limit the range to avoid inversion)
        break;
      case "down":
        setElevation((prev) => Math.min(Math.PI - 0.1, prev + step)); // Rotate down (limit the range to avoid inversion)
        break;
    }
  };

  // Zoom functions (in and out)
  const zoomIn = () => setRadius((prev) => Math.max(1, prev - 0.5)); // Limit to minimum radius
  const zoomOut = () => setRadius((prev) => prev + 0.5); // Increase radius

  return (
    <View style={styles.container}>
      {/* Canvas for 3D Model */}
      <Canvas style={styles.canvas}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 5]} intensity={1} />
        <OrbitCameraController azimuth={azimuth} elevation={elevation} radius={radius} />
        <Suspense fallback={null}>
          <SimpleModel /> {/* Render SimpleModel */}
        </Suspense>
      </Canvas>

      {/* UI controls outside the Canvas */}
      <View style={styles.dpad}>
        <TouchableOpacity
          onPressIn={() => rotateCamera("up")}
          style={styles.btn}
        >
          <Text>↑</Text>
        </TouchableOpacity>
        <View style={styles.horizontal}>
          <TouchableOpacity
            onPressIn={() => rotateCamera("right")}
            style={styles.btn}
          >
            <Text>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={() => rotateCamera("left")}
            style={styles.btn}
          >
            <Text>→</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPressIn={() => rotateCamera("down")}
          style={styles.btn}
        >
          <Text>↓</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.zoomControls}>
        <TouchableOpacity onPress={zoomIn} style={styles.btn}>
          <Text>Zoom In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={zoomOut} style={styles.btn}>
          <Text>Zoom Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  dpad: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    alignItems: "center",
  },
  horizontal: {
    flexDirection: "row",
    marginVertical: 5,
  },
  btn: {
    backgroundColor: "#ddd",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  zoomControls: {
    position: "absolute",
    bottom: 40,
    left: 20,
    alignItems: "center",
  },
});

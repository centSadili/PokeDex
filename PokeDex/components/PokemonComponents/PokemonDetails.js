import axios from "axios";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PokemonDetails = (props) => {
  const { url } = props.route.params;
  const [getPokemon, setPokemon] = useState({
    name: "",
    sprites: "",
    types: [],
  });
  useEffect(() => {
    axios.get(`${url}`).then((reponse) => {
      setPokemon(reponse.data);
    });
  }, []);
  const bgColor = (index) => {
    if (getPokemon.types.length > 0) {
      switch (getPokemon.types[index || 0].type.name) {
        case "normal":
          return "#A8A77A";
        case "fire":
          return "#EE8130";
        case "water":
          return "#6390F0";
        case "electric":
          return "#F7D02C";
        case "grass":
          return "#7AC74C";
        case "ice":
          return "#96D9D6";
        case "fighting":
          return "#C22E28";
        case "poison":
          return "#A33EA1";
        case "ground":
          return "#E2BF65";
        case "flying":
          return "#A98FF3";
        case "psychic":
          return "#F95587";
        case "bug":
          return "#A6B91A";
        case "rock":
          return "#B6A136";
        case "ghost":
          return "#735797";
        case "dragon":
          return "#6F35FC";
        case "dark":
          return "#705746";
        case "steel":
          return "#B7B7CE";
        case "fairy":
          return "#D685AD";
        default:
          return "gray";
      }
    }
    return "gray";
  };
  return (
    <View style={[style.container]}>
      <View style={[style.imageContainer, { backgroundColor: bgColor() }]}>
        <Image
          source={{ uri: getPokemon.sprites.front_default }}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>
      <View>
        <Text style={style.textName}>{getPokemon.name}</Text>
        <View style={style.typesContainer}>
          {getPokemon.types.map((item, index) => {
            return (
              <TouchableOpacity
                key={index}
                style={[
                  style.typeContainer,
                  { backgroundColor: bgColor(index) },
                ]}
              >
                <Text style={style.textType} key={index}>
                  {item.type.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={style.typesContainer}>
          <View>
            <Text style={style.textType}>
              {(getPokemon.height * 0.1).toFixed(2)} m
            </Text>
            <Text style={style.textType}>height</Text>
          </View>
          <View>
            <Text style={style.textType}>
              {(getPokemon.weight * 0.1).toFixed(2)} kg
            </Text>
            <Text style={style.textType}>weight</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
const style = StyleSheet.create({
  container: {
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "black",
    margin: 0,
    padding: 0,
  },
  imageContainer: {
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderBottomEndRadius: 50,
    borderBottomStartRadius: 50,
    margin: 5,
  },
  typesContainer: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
  },
  typeContainer: {
    height: 30,
    width: 50,
    margin: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "red",
    borderRadius: 10,
  },
  textName: {
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "center",
    color: "white",
  },
  textType: {
    textAlign: "center",
    color: "white",
  },
});
export default PokemonDetails;

import axios from "axios";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const PokemonDetails = (props) => {
  const { url } = props.route.params;
  const [getPokemon, setPokemon] = useState({
    name: "",
    sprites: "",
    types: [],
  });
  useEffect(() => {
    axios.get(`${url}`)
    .then((reponse) => {
      setPokemon(reponse.data);
    });
  }, []);
  const bgColor = () => {
    if (getPokemon.types.length > 0) {
      switch (getPokemon.types[0].type.name) {
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
          return "gray"; // Default color if type is unknown
      }
    }
    return "gray";
  };
  return (
    <View style={[style.container, { backgroundColor: bgColor() }]}>
      <View style={style.imageContainer}>
        <Image
          source={{ uri: getPokemon.sprites.front_default }}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>

      <Text style={style.textName}>{getPokemon.name}</Text>
      <View>
        {getPokemon.types.map((item, index) => {
          return <Text style={style.textType} key={index}>{item.type.name}</Text>;
        })}
      </View>
    </View>
  );
};
const style = StyleSheet.create({
  container: {
    justifyContent: "space-evenly",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 5,
    margin: 5,
  },
  imageContainer: {
    borderWidth: 1,
    borderRadius: 5,
    margin: 5,
  },
  textName: {
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "center",
  },
  textType: {
    textAlign: "center",
  },
});
export default PokemonDetails;

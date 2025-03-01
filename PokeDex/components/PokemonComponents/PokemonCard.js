import axios from "axios";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const PokemonCard = (props) => {
  const [getPokemon, setPokemon] = useState({
    order: "",
    name: "",
    sprites: "",
    types: [],
  });
 
  const { url } = props;
  useEffect(() => {
    axios.get(`${url}`).then((reponse) => {
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
      <View style={style.textContainer}>
        <Text style={style.textName}>{getPokemon.name}</Text>
        <Text>#{getPokemon.order}</Text>
      </View>
      <View style={style.imageContainer}>
        <Image
          source={{ uri: getPokemon.sprites.front_default }}
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
      </View>

      <View></View>
    </View>
  );
};
const WIDTH = Dimensions.get('window').width
const style = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    flexWrap: 'wrap',
    width: (WIDTH * 0.5) - 20,
    height: 120,
    borderWidth: 1,
    borderRadius: 5,
    margin: 5,
    padding: 20,
  },
  textContainer: { 
    flex:1,
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 5,
    height:'60%',
    width:'100%'
  },
  textName: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "center",
  },
  textType: {
    fontSize: 8,
    textAlign: "center",
  },
  imageContainer: {
    flex:1,
    alignItems: "center",
    margin: 5,
  },
});
export default PokemonCard;

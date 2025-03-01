import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PokemonCard from "./PokemonCard";
import { useNavigation } from "@react-navigation/native";

const DisplayPokemons = () => {
  const [allPokemon, setAllPokemon] = useState([]);
  const [numOfPokemon, setNumOfPokemon] = useState(9);

  const nav = useNavigation();
  useEffect(() => {
    axios
      .get(`https://pokeapi.co/api/v2/pokemon?limit=${numOfPokemon}&offset=0`)
      .then((reponse) => {
        setAllPokemon(reponse.data.results);
      });
  }, [numOfPokemon]);

  return (
    <View style={style.mainContainer}>
      <View style={style.header}>
        <Text style={style.title}>Pokemon Dex</Text>
        <TextInput
          style={style.input}
          placeholder="how many Pokemon would you like to see?"
          value={numOfPokemon}
          onChangeText={(value) => {
            setNumOfPokemon(value);
          }}
        />
      </View>
      <ScrollView contentContainerStyle={style.container}>
        {allPokemon.map((item, index) => {
          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                nav.navigate("Pokemon", { url: item.url });
              }}
            >
              <PokemonCard url={item.url} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
const style = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 5,
    paddingBottom:20,
    backgroundColor: "red",
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    flexGrow: 5,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "white",
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "90%",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlign: "center",
    backgroundColor: "white",
  },
});
export default DisplayPokemons;

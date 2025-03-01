import { NavigationContainer } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import DisplayPokemons from './components/PokemonComponents/DisplayPokemons';
import PokemonDetails from './components/PokemonComponents/PokemonDetails';

export default function App() {
  const nav = createNativeStackNavigator()
  return (
    <NavigationContainer>
      <nav.Navigator initialRouteName='PokeDex'>
        <nav.Screen name='PokeDex' component={DisplayPokemons}/>
        <nav.Screen name='Pokemon' component={PokemonDetails}/>
      </nav.Navigator>
    </NavigationContainer>
  );
}

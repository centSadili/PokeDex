import { enableScreens } from 'react-native-screens';

enableScreens();

import { NavigationContainer } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DisplayPokemons from './components/PokemonComponents/DisplayPokemons';
import PokemonDetails from './components/PokemonComponents/PokemonDetails';
import LandingPage from './components/PokemonComponents/LandingPage';

export default function App() {
  const Nav = createNativeStackNavigator()
  return (
    <NavigationContainer>
      <Nav.Navigator initialRouteName='Welcome'>
      <Nav.Screen name='Welcome' component={LandingPage}/>
        <Nav.Screen name='PokeDex' component={DisplayPokemons}/>
        <Nav.Screen name='Pokemon' component={PokemonDetails}/>
      </Nav.Navigator>
    </NavigationContainer>
  );
}

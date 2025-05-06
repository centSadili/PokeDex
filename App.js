import { enableScreens } from 'react-native-screens';

enableScreens();

import { NavigationContainer } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DisplayPokemons from './components/PokemonComponents/DisplayPokemons';
import PokemonDetails from './components/PokemonComponents/PokemonDetails';
import LandingPage from './components/PokemonComponents/LandingPage';
import TeethModelViewer from './components/PokemonComponents/TeethModelViewer';

export default function App() {
  const Nav = createNativeStackNavigator()
  return (
    <NavigationContainer>
      <Nav.Navigator initialRouteName='Teeth'>
      <Nav.Screen name='Welcome' component={LandingPage}/>
      <Nav.Screen name='Teeth' component={TeethModelViewer}/>
        <Nav.Screen name='PokeDex' component={DisplayPokemons}/>
        <Nav.Screen name='Pokemon' component={PokemonDetails}/>
      </Nav.Navigator>
    </NavigationContainer>
  );
}

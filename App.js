/**************************************************************************************
 App.js er start programmet der håndtere side navikation. 
 Appen har to sider frontpage og about.
 Frontpage er hoved programmet som går det muligt at tilføje og slette byer.
 About siden giver lokalt vejr oversigt samt forfatter detaljer.

 For yderliger beskrivelse og detaljer se frontpage.js
 *************************************************************************************/

import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import FrontPage from "./frontpage";
import About from "./about";

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="FrontPage" screenOptions={{headerShown: false}}>       
        <Stack.Screen name="FrontPage" component={FrontPage} />
        <Stack.Screen name="About" component={About} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
import Icon from 'react-native-vector-icons/FontAwesome';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import  Trips from '../screens/trips';
import React from 'react';
import Collection from '../screens/collection';
import AuthStack from '../routes/authStack';
import tripStack from '../routes/tripStack';
import collectionStack from './collectionStack'
import  notVerified from '../screens/notVerified';
const rootTabNavigation = createBottomTabNavigator(
  {
    "Trips": tripStack,
    "Collection": collectionStack,
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === 'Trips') {
          iconName = focused
            ? 'truck'
            : 'truck';
          // Sometimes we want to add badges to some icons.
          // You can check the implementation below.
        } else if (routeName === 'Collection') {
          iconName = focused ? 'rupee' : 'rupee';
        }

        // You can return any component that you like here!
        return <Icon name={iconName} size={25} color={tintColor} />;
      },
    }),
    tabBarOptions: {
      activeTintColor: '#062b3d',
      inactiveTintColor: 'gray',
    },
  }
);
export default createAppContainer(
    createSwitchNavigator(
        {
          App: rootTabNavigation,
          Auth: AuthStack,
          notVerified: notVerified
          
        },
        {
          initialRouteName: 'Auth',
        }
      )
);
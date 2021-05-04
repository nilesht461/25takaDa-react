
import {createStackNavigator} from 'react-navigation-stack';
import Headers from '../component/header';
import React from  'react';
import { LogBox } from 'react-native';
import Collection from '../screens/collection';
LogBox.ignoreLogs(['Warning: ...']); 
import Icon from 'react-native-vector-icons/FontAwesome';
const screens = {
    Collection :  {
        screen: Collection,
        navigationOptions:  ({navigation}) => {
            return  {
                headerTitle: () => <Headers navigation={navigation} title="25taka Collection"/>
            }
        }
           
    }
}


const collectionStack = createStackNavigator(screens,{
    defaultNavigationOptions: {
        headerStyle: {height:60,backgroundColor:"#062b3d"
        },
        headerTintColor: 'white'
    }
});

export default collectionStack;
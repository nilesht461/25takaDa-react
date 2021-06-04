import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import Headers from '../component/header';
import Profile from '../screens/profile';
import React from 'react';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Warning: ...']); 
const screens = {
    Profile :  {
        screen: Profile,
        navigationOptions:  ({navigation}) => {
            return  {
                headerTitle: () => <Headers navigation={navigation} title="Profile"/>
            }
        }
           
    }
}


const profileStack = createStackNavigator(screens,{
    defaultNavigationOptions: {
        headerStyle: {height:60,backgroundColor:"#062b3d"}
    }
});

export default profileStack;
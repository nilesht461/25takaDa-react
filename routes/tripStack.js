
import {createStackNavigator} from 'react-navigation-stack';
import Headers from '../component/header';
import trips from '../screens/trips';
import React from  'react';
import OrderDetails from '../screens/orderDetails';
import Payments from '../screens/payment';
import ShopDetail from '../screens/shopDetails';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Warning: ...']); 
import Icon from 'react-native-vector-icons/FontAwesome';
const screens = {
    Trips :  {
        screen: trips,
        navigationOptions:  ({navigation}) => {
            return  {
                headerTitle: () => <Headers navigation={navigation} title="25taka Delivery"/>,
            }
        }
           
    },
    OrderDetails :  {
        screen: OrderDetails,  
        navigationOptions:  ({navigation}) => {
            return  {
                headerTitle: () => <Headers navigation={navigation} title="Order Details"/>
            } 
        }     
    },
    ShopDetail :  {
        screen: ShopDetail,  
        navigationOptions:  ({navigation}) => {
            return  {
                headerTitle: () => <Headers navigation={navigation} title="Shop Details"/>
            }
        }     
    },
    
    Payment :  {
        screen: Payments,  
        navigationOptions:  ({navigation}) => {
            return  {
                headerTitle: () => <Headers navigation={navigation} title="Payment Details"/>
            }
        }     
    }
}


const tripStack = createStackNavigator(screens,{
    defaultNavigationOptions: {
        headerStyle: {height:60,backgroundColor:"#062b3d"
        },
        headerTintColor: 'white'
    }
});

export default tripStack;
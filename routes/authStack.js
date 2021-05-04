
import {createStackNavigator} from 'react-navigation-stack';
import Headers from '../component/header';
import PhoneAuthScreen from '../screens/signin';
import SignUp from '../screens/signup';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Warning: ...']); 
const screens = {
    SignIn :  {
        screen: PhoneAuthScreen,
           
    },
    SignUp :  {
        screen: SignUp,       
    }
}


const AuthStack = createStackNavigator(screens,{
    defaultNavigationOptions: {
        title: '',
        headerLeft: ()=> null,
    }
});

export default AuthStack;
import React from 'react';
import {View,Text,StyleSheet} from 'react-native';
import { Icon } from 'react-native-elements';

const Headers = ({navigation,title}) => {
    return(<View style={{flexDirection:"row"}}>
              <View style={styles.header}>
                 <Text style={styles.headerText}>{title}</Text>
              </View>
            </View>
    )
} 
 
const styles = StyleSheet.create ({
    header: {
        height:"100%",
        width:"85%",
        // backgroundColor:"#3880ff",
        flexDirection :"row",
        alignItems: "center",
        justifyContent: "center",
        fontSize:28
    },
    headerText :  {
        fontWeight: "bold",
        fontSize:20,
        color:'white'
        
    },
})

export default Headers;
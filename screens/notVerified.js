import React from 'react';
import {View,StyleSheet,Text} from 'react-native';

const notVerified = () => {
        return (
            <View style={{position:'absolute',top:'40%'}}>
                <Text style={{textAlign:'center'}}>You are not added as delivery boy Please contact admin</Text>
            </View>
        )
}

export default notVerified;
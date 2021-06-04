import React, { useEffect, useState } from 'react';
import {View,StyleSheet,Text,Alert} from 'react-native';
import { Card,Input } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon  from 'react-native-vector-icons/Entypo';
import {getUserById} from '../services/user';
import auth from '@react-native-firebase/auth';
import { ActivityIndicator } from 'react-native';
import DeviceInfo from 'react-native-device-info';
const Profile = (props) => {
    const [leaderNumber,setLeaderNumber]  = useState("");
    const [activePerson,setActivePerson] = useState(null);
    const [loader,setLoader] = useState(false)
    useEffect(async() => {
       getUserDetails()   
    },[])
    const getUserDetails = async() => {
        let user = auth().currentUser;
        let activeUser = await getUserById(user.uid);
        activeUser.forEach(async(element) => {
            let userdata = {};
             userdata['user']  = element.data();
            setActivePerson(userdata)
        })
    }
    const logoutHandler = () => {
        Alert.alert(
            "25taka",
            "Are you sure you want to log out?",
            [
              {
                text: "Cancel",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel"
              },
              {
                text: "OK", onPress: async () => {
                    auth().signOut().then(res => {
                        props.navigation.navigate('Auth')
                    });
             }
            }
        ])
    }
       
    return(
        <View>
            {activePerson &&  <Card containerStyle={styles.Card}>
                <Card.Title>{activePerson.user.firstName} {activePerson.user.lastName}</Card.Title>
                <Card.Divider></Card.Divider>
                <View style={{flexDirection:'row',marginVertical:10}}>
                <Text style={{fontWeight:'bold'}}>Phone Number :- </Text><Text> {activePerson.user.phoneNumber}</Text>
                </View>
                {activePerson.leader &&  <View style={{flexDirection:'row'}}>
                <Text style={{fontWeight:'bold'}}>Leader Name :- </Text><Text>{activePerson.leader.firstName} {activePerson.leader.lastName}</Text>
                </View>
                }
            </Card>
            } 
          {activePerson && <Card containerStyle={styles.Card}> 
          <TouchableOpacity onPress={() =>logoutHandler()}>
               <Text style={styles.logout}>Log out</Text>
           </TouchableOpacity> 
           </Card> 
           } 
           {activePerson ? <Text style={{textAlign:'center',top:'20%'}}>Version({DeviceInfo.getVersion()})</Text> : null}
        </View>
    )
}
const styles = new StyleSheet.create({
    buttonText : {
            paddingHorizontal:30,
            paddingVertical:10,
            textAlign:'center',
            backgroundColor:'#062b3d',
            color:'white',
    },
    logout : {
        paddingHorizontal:30,
        paddingVertical:10,
        textAlign:'center',
        backgroundColor:'red',
        color:'white',
},
Card: {
    borderRadius: 10,
    elevation: 10,
},
})

export default Profile;
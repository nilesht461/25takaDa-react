import React, { useEffect,useState } from 'react';
import {StyleSheet,View,TextInput,Button,Text,Image,ActivityIndicator} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {addUser,getUserById,getUserByNumber} from '../services/user';
import auth from '@react-native-firebase/auth';
const SignUp  = (props) => {
    const [formdata,setFormData] = useState({firstName:'',lastName:'',leaderNumber:''})
    const [showBusy,setShowBusy] = useState(true);
    const onChangeText = (name,text)=> {
        setFormData({
            ...formdata,
            [name]: text
        });
        console.log(formdata);
        };
    const saveData = async() => {
            if(formdata.firstName != '' && formdata.lastName != '') {
              let user = auth().currentUser;
                let obj = {
                    "userId": user.uid,
                    "phoneNumber" : user.phoneNumber, 
                    "firstName":formdata.firstName,
                    "lastName" : formdata.lastName,
                    "role" : 'DRIVER',
                    "verified" : true,
                    "createdAt" : `${Date.now()}`

                }
                await addUser(obj);
                props.navigation.navigate('App')
            }
    }
    useEffect(async() =>  {
        let user = auth().currentUser;
        console.log(user.uid);
        let users = await getUserById(user.uid);
        console.log(users.docs.length,"12434")
        if(users.docs.length) {
          users.docs.forEach(element => {
            if(element.data().verified == true && element.data().role == 'DRIVER') {
            props.navigation.navigate('App');
            setShowBusy(false);
            }
            else {     
              props.navigation.navigate('notVerified');
          }
          });           
        }  else {
          setShowBusy(false)
        }
    },[])
    return(
        <View style={styles.container}>
        {showBusy ? <ActivityIndicator size="large" color="#3880ff"/>
        :
        <View>
        <Image style={{marginHorizontal:"15%"}} source={require('../assets/PT_Logo.png')} />
        <TextInput
          style={styles.input}
          placeholder='First name'
          autoCapitalize="none"
          placeholderTextColor='grey'
          value={formdata.firstName}
          onChangeText={val => onChangeText('firstName', val)}
        />
        <TextInput
          style={styles.input}
          placeholder='Last name'
          autoCapitalize="none"
          placeholderTextColor='grey'
          value={formdata.lastName}
          onChangeText={val => onChangeText('lastName', val)}
        />
          <TouchableOpacity style={styles.saveButton}>
                                <Text style={styles.saveLeadText} onPress={() => saveData()}>Sign up</Text>
           </TouchableOpacity>
      </View> }
      </View>

    )
}

const styles = StyleSheet.create({
    input: {
      width: 350,
      height: 40,
      backgroundColor: 'white',
      margin: 10,
      padding: 8,
      color: 'black',
      borderRadius: 6,
      borderBottomWidth:1,
      borderBottomColor:'black',
      fontSize: 18,
      fontWeight: '500',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor:'white'
    },
    saveButton: {
        padding:10,
        backgroundColor:"black",
        color:"white",
        marginTop:20,
        width:"50%",
        marginHorizontal:"20%"
      },
      saveLeadText : {
        color:"white",
        textAlign:'center',
        padding:5,
        // fontWeight:"bold",
        fontSize:17
      },
});
export default SignUp;
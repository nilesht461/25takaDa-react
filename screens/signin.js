import React, { Component,useEffect } from 'react'
import {StyleSheet,SafeAreaView,TouchableOpacity,View,Text,TextInput,Image,ActivityIndicator} from 'react-native'
import auth from '@react-native-firebase/auth';
class PhoneAuthScreen extends Component {
    state = {
      phone: '',
      confirmResult: null,
      verificationCode: '',
      userId: '',
      showBusy: false
    }
    componentDidMount() {
      let user = auth().currentUser;
      if (user != null) {
          // User is signed in
          console.log(user,"abcdf")
          this.props.navigation.navigate('SignUp');
      } else {
          // No user is signed in
          // this.props.navigation.navigate('App');
      }
    }
    validatePhoneNumber = () => {
        var regexp = /^[0-9]{10}$/
        return regexp.test(this.state.phone)
      }
      handleSendCode = () => {
        // Request to send OTP
        if (this.validatePhoneNumber()) {
            console.log(this.state.phone);
            this.setState({showBusy: true})
            auth()
            .signInWithPhoneNumber(`+91${this.state.phone}`)
            .then(confirmResult => {
              this.setState({ confirmResult })
              this.setState({showBusy: false})
              auth().onAuthStateChanged((user) => {
                if(user) {
                  this.props.navigation.navigate('SignUp');
                } else {
                }
              });
            })
            .catch(error => {
              alert(error.message)
            })
        } else {
          alert('Invalid Phone Number')
        }
      }
      changeNumber = () => {
        this.setState({phone: '',
        confirmResult: null,
        verificationCode: '',
        userId: '',
        showBusy: false})
      }
      handleVerifyCode = () => {
        // Request for OTP verification
        this.setState({showBusy: true})
        const { confirmResult, verificationCode } = this.state
        if (verificationCode.length == 6) {
        confirmResult
        .confirm(verificationCode)
        .then(user => {
        console.log(user);
        this.setState({showBusy: false})
        this.setState({ userId: user.uid })
        alert(`Successfully LoggedIn`)
        this.props.navigation.navigate('SignUp')
        })
        .catch(error => {
        alert(error.message)
        console.log(error)
        })
        } else {
        alert('Please enter a 6 digit OTP code.')
        this.setState({showBusy: false})
        }
        }
        renderConfirmationCodeView = () => {
        return (
        <View style={styles.verificationView}>
        <TextInput
        style={styles.textInput}
        placeholder='Verification code'
        placeholderTextColor='#eee'
        value={this.state.verificationCode}
        keyboardType='numeric'
        onChangeText={verificationCode => {
        this.setState({ verificationCode })
        }}
        maxLength={6}
        />
        <View style={{flexDirection:'row'}}>
        <TouchableOpacity
        style={[styles.button, { marginTop: 20,flex:1,backgroundColor:'white',borderWidth:1 }]}
        onPress={this.handleSendCode}>
        <Text style={[styles.themeButtonTitle,{color:'black'}]}>Resend OTP</Text>
        </TouchableOpacity>
        <TouchableOpacity
        style={[styles.button, { marginTop: 20,flex:1 }]}
        onPress={this.handleVerifyCode}>
        <Text style={styles.themeButtonTitle}>Verify</Text>
        </TouchableOpacity>
        </View>
        <Text onPress={() => this.changeNumber()} style={{color:'blue',marginVertical:50,textAlign:'center'}}>Change Number -> </Text>
        </View>
        )
        }
        render() {
            return (
            <SafeAreaView style={[styles.container, { backgroundColor: 'white' }]}>
            <View style={styles.page}>
            <Image source={require('../assets/PT_Logo.png')} />
            {this.state.confirmResult || this.state.showBusy ? null :
            <View style={{width:"100%",marginLeft:"10%"}}>
            <TextInput
            style={styles.textInput}
            placeholder='Phone Number'
            placeholderTextColor='#eee'
            keyboardType='phone-pad'
            value={this.state.phone}
            onChangeText={phone => {
            this.setState({ phone })
            }}
            maxLength={15}
            editable={this.state.confirmResult ? false : true}
            />
           
            <TouchableOpacity
            style={[styles.themeButton, { marginTop: 20 }]}
            onPress={
            this.state.confirmResult
            ? this.changePhoneNumber
            : this.handleSendCode
            }>
            <Text style={styles.themeButtonTitle}>
              GET OTP
            </Text> 
            </TouchableOpacity>
            </View> 
            }
            {this.state.confirmResult || this.state.showBusy ? this.renderConfirmationCodeView() : null}
            {this.state.showBusy ? <ActivityIndicator style={styles.loading} size="large" color="#3880ff" />: null }
            </View>
            </SafeAreaView>
            )
            }
  }
  const styles = StyleSheet.create({
    container: {
      flex:1,
      backgroundColor: 'white'
    },
    page: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    textInput: {
      marginTop: 20,
      width: '90%',
      height: 40,
      borderColor: '#555',
      borderWidth: 2,
      borderRadius: 5,
      paddingLeft: 10,
      color: 'black',
      fontSize: 16
    },
    themeButton: {
      width: '90%',
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#062b3d',
      borderRadius: 5
    },
    button: {
      marginHorizontal:20,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'black',
      borderRadius: 5
    },
    themeButtonTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: '#fff'
    },
    verificationView: {
      width: '100%',
      alignItems: 'center',
      marginTop: 50
    }
  })
  export default PhoneAuthScreen
import React,{useState} from 'react';
import { View, StyleSheet, Text, FlatList, Linking, TouchableOpacity } from 'react-native';
import { Card,BottomSheet } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import {getShopDetails} from '../services/shipment';
import Spinner from 'react-native-loading-spinner-overlay';
const ShipmentCard = ({ trips, navigation }) => {
    let [isVisible,setIsVisible] = useState(false);
    let [selectedTrip,setSelectedTrip] = useState(null);
    let [verification,setVerification] = useState({docVerify: true,handshake: true,shopImage: true});
    const [spinner,setSpinner] = useState(false);
    const routeToDelivery = (trip) => {
        navigation.navigate('OrderDetails', { "data": trip })
      }
    
    const onOrderClick = async(trip) => {
        setSpinner(true);
        console.log('clicked');
        let aadharStatus =  '';
        let panStatus  =  '';
        let shop =  await getShopDetails(trip.shop.shopId);
        trip.shop = shop.data();
        verfication = {docVerify: true,handshake: true,shopImage: true};
        setVerification({...verification});
        let selectedTrip = {...trip};
        setSpinner(false);
        // console.log(selectedTrip.shop.shopImage)
        setSelectedTrip(trip);
        if(selectedTrip.status == "FINISHED") {
          routeToDelivery(trip);
          return;
        }
        if(!trip.shop.shopImage) {
            // console.log('it ran ',trip.shop)
            setVerification({...verification,['shopImage']: false});
            setIsVisible(true);
            return;
        }
        if(!selectedTrip.shop.verified && selectedTrip.order.creditUsed !=0) {
            verification.shopImage = true;
            setVerification({...verification,['docVerify']: false});
            setIsVisible(true);
            return
        }
        if(!selectedTrip.shop.documents && selectedTrip.order.creditUsed !=0) {
            setVerification({...verification,['docVerify']: false});
            setIsVisible(true);
            return
        }
        if(selectedTrip.shop.documents && selectedTrip.order.creditUsed !=0) {
        if(Object.keys(selectedTrip.shop.documents).length < 2 && selectedTrip.order.creditUsed !=0) {
            setVerification({...verification,['docVerify']: false});
            setIsVisible(true);
            return
        }
        if(Object.keys(selectedTrip.shop.documents).length >= 2 && selectedTrip.order.creditUsed !=0) {
          for (var key in selectedTrip.shop.documents) {
          if (selectedTrip.shop.documents.hasOwnProperty(key)) {
            if(key == 'PAN') {
              panStatus = selectedTrip.shop.documents[key].status
            }
            if(key == 'AADHAR') {
              aadharStatus = selectedTrip.shop.documents[key].status
            }
       } 
     }
    }    
    if((panStatus == 'PENDING' || panStatus == '') && (aadharStatus == 'PENDING' || aadharStatus == '') && selectedTrip.order.creditUsed !=0 ) {
            setVerification({...verification,['docVerify']: false});
            setIsVisible(true);
            return
          }
        }
        if (selectedTrip.hasOwnProperty("handshake") && !selectedTrip.handshake) {
            setVerification({...verification,['handshake']: false});
            setIsVisible(true);
            return
        } 
          routeToDelivery(trip);
    }
    const renderItems = ({ item }) => {
        return (<Card containerStyle={styles.Card}>
            <TouchableOpacity><Card.Title onPress={() => onOrderClick(item)} style={styles.title}>{item.orderNo}</Card.Title></TouchableOpacity>
            <Card.Divider></Card.Divider>
            <Text style={styles.name} onPress={() => { navigation.navigate('ShopDetail', { "data": item.shop,"orderNo":item.orderNo }) }}>{item.shop.name}</Text>
            <Text style={styles.address}>{item.order.deliveryAddress.line1},{item.order.deliveryAddress.landmark},{item.order.deliveryAddress.city},{item.order.deliveryAddress.state},{item.order.deliveryAddress.pincode}</Text>
            <View style={{ flexDirection: 'row',height:30 }}>
                <Text style={styles.number} onPress={() => Linking.openURL(`tel:${item.shop.contacts[0].phone}`)}>{item.shop.contacts[0].phone}</Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + item.shop.location.lat + ',' + item.shop.location.lng, '_system')}><Icon style={styles.icon} name="location-arrow"></Icon></TouchableOpacity>
            </View>
            {item.dsrName && item.dsrNumber ? 
            <View style={{flexDirection: 'row',marginBottom:7}}>
                <Text style={styles.dsr}>Sales Exec:- </Text>
                <Text style={styles.dsr1} >{item.dsrName}</Text>
                <TouchableOpacity style={{paddingHorizontal:4,borderWidth:1,borderRadius:5}} onPress={() => Linking.openURL(`tel:${item.dsrNumber}`)} >
                <Icon style={{marginTop:3}} name="phone" size={10} color="#062b3d" />
                </TouchableOpacity>
            </View> : null}
            <Text style={[styles.basic,item.status == 'ASSIGNED' ? styles.active: item.status == 'FINISHED' ? styles.finished : styles.canceled ]} >{item.status}</Text>
        </Card>
        )
    }
    const switchToPod = () => {
        setIsVisible(false);
        selectedTrip.order.creditUsed = 0;
        let obj = {...selectedTrip};
        navigation.navigate('OrderDetails', { "data": obj })
    }
    return (
        <View>
              <Spinner
          visible={spinner}
          textStyle={styles.spinnerTextStyle}
        />
            <FlatList
                //   refreshControl={
                //     <RefreshControl
                //     refreshing={showBusy}
                //     onRefresh={getData}
                //    />
                //    }
                data={trips}
                style={{flex:0,marginBottom:100}}
                renderItem={renderItems}
                keyExtractor={(item, index) => index.toString()}
            // onEndReached={loadMore}
            // onEndReachedThreshold={0}
            />
            <BottomSheet
                isVisible={isVisible}
                containerStyle={{ backgroundColor: 'rgba(0.5, 0.25, 0, 0.2)' }}
            >
                <View style={styles.bottomMenu}>
                <Icon name="close" style={styles.close} onPress={() => {setIsVisible(false);setVerification({'docVerify': true,shopImage: true,handshake: true})}} size={24} color="#062b3d" />
                    {!verification.shopImage ? <TouchableOpacity onPress={() => {setIsVisible(false);navigation.navigate('ShopDetail', { "data": selectedTrip.shop ,"orderNo":selectedTrip.orderNo}) }} style={[styles.button, { backgroundColor: '#062b3d'}]}><Text style={styles.buttonText}>Upload Shop Image</Text>
                    </TouchableOpacity>: null}
                    <View style={{flexDirection:'row'}}>
                    {!verification.docVerify ? <TouchableOpacity onPress={() => { setIsVisible(false);navigation.navigate('ShopDetail', { "data": selectedTrip.shop,"orderNo":selectedTrip.orderNo  }) }} style={[styles.button, { backgroundColor: '#062b3d',flex:1 }]}><Text style={styles.buttonText}>Upload Documents</Text>
                    </TouchableOpacity>: null}
                    {!verification.docVerify ? <TouchableOpacity onPress={() => {switchToPod()}} style={[styles.button, { backgroundColor: '#062b3d',flex:1 }]}><Text style={styles.buttonText}>Switch to POD</Text>
                    </TouchableOpacity>: null}
                    </View>
                    {!verification.shopImage ?<Text style={[styles.warning,{textAlign:'center'}]}>Shop image is not available !</Text>: null}
                    {!verification.docVerify ?<Text style={styles.warning} s>₹{selectedTrip.order.creditUsed} credit used but documents not verified</Text>: null}
                </View>
            </BottomSheet>
        </View>
    )
};
const styles = StyleSheet.create({
    Card: {
        borderRadius: 10,
        elevation: 10,
        flex: 1
    },
    title: {
        textAlign: 'left',
        fontSize: 17,
        color: "#3880ff",
        marginBottom: 10
    },
    name: {
        color: 'red',
        fontSize: 17,
        marginTop: -5
    },
    address: {
        fontSize: 14,
        marginVertical: 5,
        color: 'grey'
    },
    number: {
        fontSize: 15,
        marginVertical: 5,
        color: '#3880ff',
        flex: 1,
    },
    status: {
        fontSize: 14,
        marginRight: 40,
        color: 'grey'
    },
    loader: {
        position: 'absolute',
        top: "90%",
        left: "40%"
    },
    dsr:{
        fontSize:15,
        color: 'grey'
    },
    dsr1: {
        fontSize:15,
        marginHorizontal:5,
        color:'#062b3d'
    },
    basic: {
        fontSize: 13,
        paddingHorizontal: 5,
        paddingVertical: 3,
        color: 'white',
        width: '23%',
        borderRadius: 5,
        flex: 0,
        textTransform: 'capitalize',
    },
    active : {
        backgroundColor: 'green',
    },
    finished : {
        backgroundColor: 'blue',
    },
    canceled: {
        backgroundColor: 'red',
    },
    icon: {
        height: 40,
        width: 40,
        fontSize: 20,
        backgroundColor: '#062b3d',
        color: 'white',
        borderRadius: 25,
        textAlign: 'center',
        textAlignVertical: 'center',
        marginRight: 20,
        marginTop: 10,
    },
    button: {
        flex: 0,
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: 'grey',
        marginHorizontal: 10,
        marginTop:40,
        borderRadius: 10
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 1.1
    },
    bottomMenu: {
        height:'100%',
        width:'100%',
        backgroundColor:'white'
    },
    close : {
        left:'90%',
        paddingVertical:10,
        paddingEnd:10,
        elevation:10
    },
    warning : {
        marginHorizontal:"10%",
        marginVertical:'10%',
        fontWeight:'bold'
    },
    spinnerTextStyle: {
        color: '#062b3d'
      },
})

export default ShipmentCard;
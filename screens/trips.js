import React, { useEffect, useState,useI } from 'react';
import {View,Text,StyleSheet,RefreshControl} from 'react-native';
import { Card,Input,BottomSheet ,ButtonGroup} from 'react-native-elements';
import {getFinishedShipmentsByDate, getOrderDetails, getShipments, getShopDetails,getActiveShipmentsByDate} from '../services/shipment';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import ShipmentCard from '../component/shipmentCard.js';
import { ActivityIndicator } from 'react-native';
import _ from "lodash";
import globalDate from '../services/date';
import DateTimePicker from '@react-native-community/datetimepicker';
const trips = ({navigation}) => {
    const [user,setUser] = useState(auth().currentUser);
    const [date, setDate] = useState(moment().format("DD/MM/YYYY"));
    const value = navigation.getParam('data', false);
    let [noShipmentFlag,setNoShipmentFlag] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    let [isVisible,setIsVisible] = useState(false);
    let [allTrips,setTrips] = useState([]);
    let [banner,setBanner]  = useState({'cancelled': 0 , 'active': 0, 'finished': 0})
    let isFocused = navigation.isFocused(); 
    const buttons = [`Active (${banner.active})`,`Finished (${banner.finished})`,`Cancelled (${banner.cancelled})`];
    const [selectedIndex,setSelectedIndex] = useState(0);
    useEffect(() => {
        loadData();
        const unsubscribe = navigation.addListener('willFocus', () => {
        allTrips = [];
        setTrips([])
        loadData();
        });  
        return unsubscribe;
      }, [navigation]);
    const loadData = async() => {
        await getallTripCounts();
        await getShipmentData('ASSIGNED');
        setSelectedIndex(0)
    }
    const updateIndex  = (selectedIndex) => {
        setSelectedIndex(selectedIndex);
        if(selectedIndex == 1) {
          getShipmentData('FINISHED')
        }
        if(selectedIndex== 0) {
            getShipmentData('ASSIGNED')
        }
        if(selectedIndex== 2) {
            getShipmentData('CANCELED')
        }
      }
   const getallTripCounts = async() => {
            // setDate(moment(startTime).format("DD/MM/YYYY"))
            allTrips = [];
            setTrips([]);
            setNoShipmentFlag(false)
            globalDate.tripDate.startTime.setHours(0,0,0,0);
            globalDate.tripDate.endTime.setHours(23,59,59,59);
            let cancelledTrips = await getShipments(user.uid,'CANCELED',globalDate.tripDate.startTime,globalDate.tripDate.endTime);
            let activeTrips =  await getActiveShipmentsByDate(user.uid,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
            let finishedTrips = await getFinishedShipmentsByDate(user.uid,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
            let banner = {
                'cancelled' : cancelledTrips.docs.length,
                'active': activeTrips.docs.length,
                'finished': finishedTrips.docs.length
            }
            setBanner({...banner});
            
   }
   const getShipmentData = async(type) => {
    setNoShipmentFlag(false)
    let shipments = await getShipments(user.uid,type,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    allTrips = [];
    setTrips([]);
    if(shipments.docs.length == 0) {
        setNoShipmentFlag(true);
    }
    shipments.docs.forEach(async (element) => {
        let trip = element.data();
        let order  = await getOrderDetails(element.data().orderId);  
        let shop =  await getShopDetails(element.data().shopId);
        order.docs.forEach(res => {
            trip['order'] = res.data();
        });
        shop.docs.forEach(res => {
            trip['shop'] = res.data();
        })
        allTrips.push(trip)
       setTrips([...allTrips])
    });
   }
   const updateDate = () => {
       setShowDatePicker(true);
   }
   const onCalendarChange = (event, date) => {
    setShowDatePicker(false);
   if(date) {
    globalDate.tripDate.startTime = _.cloneDeep(date);
    globalDate.tripDate.endTime = _.cloneDeep(date)
    setDate(moment(date).format("DD/MM/YYYY"));
    loadData()
   } else {
   }
}
    return (
        <View style={{flex:1}}>
                <Text onPress={() => updateDate()} style={styles.cardHeader}>{date}<Icon style={styles.calendar} name="calendar"></Icon></Text>
            <ButtonGroup
                onPress={updateIndex}
                selectedIndex={selectedIndex}
                buttons={buttons}
                selectedButtonStyle={{backgroundColor:'#062b3d'}}
                containerStyle={styles.tabs}
                />
            {allTrips.length && !noShipmentFlag ? <ShipmentCard  
                   style={{flex:1}} trips={allTrips} navigation={navigation}/> : null} 
                   {!noShipmentFlag && !allTrips.length ? <ActivityIndicator  size="large" color="#062b3d"></ActivityIndicator>: null}
                   {noShipmentFlag ? <Text style={styles.emptyShipment}>No Shipment available !</Text>: null}
            {showDatePicker ? <DateTimePicker
                testID="dateTimePicker"
                value={new Date(moment(date, 'DD/MM/YYYY').valueOf())}
                mode='date'
                is24Hour={true}
                display="calendar"
                is24Hour={true}
                maximumDate={new Date()}
                onChange={onCalendarChange}
            /> : null}
        </View>
    )
}

const styles = StyleSheet.create({
cardHeader: {
    color:'#062b3d',
    fontSize:17,
    textAlign:'center',
    fontWeight:'bold',
    marginVertical:20
},
cardBody : {
    flexDirection:'row',
    marginVertical:10,
    textAlign:'center',
    marginHorizontal:30
},
tabs : {
    height:30,
    borderRadius:10,
},
calendar: {
    fontSize: 18,
    color:'#062b3d'
},
emptyShipment: {
    textAlign:'center',
    marginVertical:'30%',
    fontSize:17,
    color:'#062b3d'
}
})

  export default trips;
import React, { useEffect, useState } from 'react';
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
import { useSelector,useDispatch } from 'react-redux'
import {updateCount, updateTrips} from '../services/helper';
import Spinner from 'react-native-loading-spinner-overlay';
const trips = ({navigation}) => {
    const state = useSelector(state => state);
    // console.log(state)
    const dispatch = useDispatch();
    const [user,setUser] = useState(auth().currentUser);
    const [date, setDate] = useState(moment().format("DD/MM/YYYY"));
    const value = navigation.getParam('data', false);
    let [noShipmentFlag,setNoShipmentFlag] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    let [isVisible,setIsVisible] = useState(false);
    let [spinner,setSpinner] = useState(false);
    let isFocused = navigation.isFocused(); 
    const buttons = [`Active (${ state.count.activeTrips})`,`Finished (${state.count.finishedTrips})`,`Cancelled (${state.count.cancelledTrips})`];
    const [selectedIndex,setSelectedIndex] = useState(0);
    useEffect(() => {
        loadData();
      }, [navigation]);
    const loadData = async() => {
        setNoShipmentFlag(false);
        setSelectedIndex(0)
        dispatch({type: 'updateCount',payload:{count:{'activeTrips' : 0,'finishedTrips':0,'cancelledTrips': 0 }}})
        dispatch({type: 'updateTrips',payload:{trips:{'activeTrips' : [],'finishedTrips':[],'cancelledTrips': [],'visibleTrips':[] }}})
        await getallTripCounts();
        await getShipmentData('ASSIGNED');
        setSpinner(true);
        await  getShipmentData('FINISHED');
        await getShipmentData('CANCELED');
        setSpinner(false)
        
    }
    const updateIndex  = (selectedIndex) => {
        setNoShipmentFlag(false)
        setSelectedIndex(selectedIndex);
        // console.log(state.trips.activeTrips.length)
        if(selectedIndex == 1) {
            if(state.trips.finishedTrips.length == 0) {
                setNoShipmentFlag(true)
            }
            let trips = {...state.trips,visibleTrips:state.trips.finishedTrips}
            dispatch({type: 'updateTrips',payload:{trips:trips}})
    }
        if(selectedIndex== 0) {
            if(state.trips.activeTrips.length == 0) {
                setNoShipmentFlag(true)
            }
            let trips = {...state.trips,visibleTrips:state.trips.activeTrips}
            dispatch({type: 'updateTrips',payload:{trips:trips}})
        }
        if(selectedIndex== 2) {
            if(state.trips.cancelledTrips.length == 0) {
                setNoShipmentFlag(true)
            }
            let trips = {...state.trips,visibleTrips:state.trips.cancelledTrips}
            dispatch({type: 'updateTrips',payload:{trips:trips}})
        }
      }
   const getallTripCounts = async() => {
            // setDate(moment(startTime).format("DD/MM/YYYY"))
            let count = await updateCount()
            dispatch({type: 'updateCount',payload:{count:count}})
            
   }
   const getShipmentData = async(type) => {
    let trips = {};
    if(type =='ASSIGNED') {
        state.trips.activeTrips = await updateTrips(type);
        if(state.trips.activeTrips.length == 0) {
            setNoShipmentFlag(true)
        }
    trips = {
        'activeTrips':state.trips.activeTrips,
        'finishedTrips': state.trips.finishedTrips ? state.trips.finishedTrips: [],
        'cancelledTrips': state.trips.cancelledTrips ? state.trips.cancelledTrips: [],
        'visibleTrips': state.trips.activeTrips
    }
}
    if(type =='FINISHED') {
        state.trips.finishedTrips = await updateTrips(type);
        trips = {
            'activeTrips':state.trips.activeTrips,
            'finishedTrips': state.trips.finishedTrips,
            'cancelledTrips': state.trips.cancelledTrips ? state.trips.cancelledTrips: [],
            'visibleTrips':state.trips.activeTrips
        }
        }
        if(type =='CANCELED') {
            state.trips.cancelledTrips = await updateTrips(type);;
             trips = {
                'activeTrips':state.trips.activeTrips,
                'finishedTrips': state.trips.finishedTrips,
                'cancelledTrips': state.trips.cancelledTrips,
                'visibleTrips':state.trips.activeTrips
            }
            };
    dispatch({type: 'updateTrips',payload:{trips:trips}})

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
                 <Spinner
          visible={spinner}
        />
                <Text onPress={() => updateDate()} style={styles.cardHeader}>{date}<Icon style={styles.calendar} name="calendar"></Icon></Text>
            <ButtonGroup
                onPress={updateIndex}
                selectedIndex={selectedIndex}
                buttons={buttons}
                selectedButtonStyle={{backgroundColor:'#062b3d'}}
                containerStyle={styles.tabs}
                />
            {state.trips.visibleTrips?.length ? <ShipmentCard  
                   style={{flex:1}} trips={state.trips.visibleTrips} navigation={navigation}/> : null} 
                   {!noShipmentFlag && !state.trips.visibleTrips?.length ? <ActivityIndicator  size="large" color="#062b3d"></ActivityIndicator>: null}
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
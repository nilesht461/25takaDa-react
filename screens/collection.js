import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator,RefreshControl } from 'react-native';
import { Card, Input } from 'react-native-elements';
import { getShopDetails, getTotalPaymentByDate } from '../services/shipment';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import PaymentCard from '../component/paymentCard';
import _ from "lodash";
import globalDate from '../services/date'
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
const collection = ({ navigation }) => {
    const [date, setDate] = useState(moment().format("DD/MM/YYYY"));
    const [user, setUser] = useState(auth().currentUser);
    const [showDatePicker, setShowDatePicker] = useState(false);
    let [paymentInfo, setPaymentInfo] = useState([]);
    let [showNoPaymentFlag,setShowNoPaymentFlag] = useState(false);
    let [collection, setCollection] = useState({ 'total': 0, 'upi': 0, 'cash': 0, 'cheque': 0 });
    useEffect(() => {
        updatePaymentData()
        const unsubscribe = navigation.addListener('willFocus', () => {
            updatePaymentData();
        });  
        return unsubscribe;
      }, [navigation]);
    const updatePaymentData = async () => {
        globalDate.collectionDate.startTime.setHours(0, 0, 0, 0);
        globalDate.collectionDate.endTime.setHours(23, 59, 59, 59);
        paymentInfo = [];
        setPaymentInfo([]);
        let paymentData = await getTotalPaymentByDate(user.uid,globalDate.collectionDate.startTime,globalDate.collectionDate.endTime);
        if(paymentData.docs.length == 0) {
            setShowNoPaymentFlag(true);
        }
        setCollection({ 'total': 0, 'upi': 0, 'cash': 0, 'cheque': 0 })
        collection = { 'total': 0, 'upi': 0, 'cash': 0, 'cheque': 0 }
        paymentData.docs.forEach(async (element) => {
            let tempObj = {};
            tempObj = element.data();
            let shopInfo = await getShopDetails(element.data().shopId);
                tempObj['shop'] = shopInfo.data();
            collection['total'] = collection['total'] + element.data().amount;
            if (element.data().mode == 'UPI') {
                collection['upi'] = collection['upi'] + element.data().amount;
            }
            if (element.data().mode == 'CASH') {
                collection['cash'] = collection['cash'] + element.data().amount;
            }
            if (element.data().mode == 'CHEQUE') {
                collection['cheque'] = collection['cheque'] + element.data().amount;
            }
            paymentInfo.push(tempObj);
            setPaymentInfo([...paymentInfo]);
            setCollection({ ...collection });
        })
    }
    const updateDate = () => {
        setShowDatePicker(true);
        // console.log(new Date())
    }
    const onCalendarChange = (event, date) => {
    setShowDatePicker(false);
    if(date) {
     globalDate.collectionDate.startTime = _.cloneDeep(date);
     globalDate.collectionDate.endTime = _.cloneDeep(date)
     setDate(moment(date).format("DD/MM/YYYY"));
     updatePaymentData();
    } else {
    }
 }
    return (
        <View
           style={{ flex: 1 }}>
            <Card containerStyle={styles.Card}>
                <Text onPress={() => updateDate()} style={styles.cardHeader}>{date}<Icon style={styles.calendar} name="calendar"></Icon></Text>
                <View style={styles.cardBody}>
                    <Text style={styles.cardText}>Total</Text>
                    <Text style={styles.cardText}>UPI</Text>
                    <Text style={styles.cardText}>cash</Text>
                    <Text style={styles.cardText}>Cheque</Text>
                </View>
                <View style={styles.cardBody1}>
                    <Text style={styles.cardText1}>₹{collection.total}</Text>
                    <Text style={styles.cardText1}>₹{collection.upi}</Text>
                    <Text style={styles.cardText1}>₹{collection.cash}</Text>
                    <Text style={styles.cardText1}>₹{collection.cheque}</Text>
                </View>
            </Card>
            {paymentInfo.length ? <PaymentCard    
            style={{ flex: 0 }} paymentInfo={paymentInfo} navigation={navigation} /> : null}
            {!showNoPaymentFlag && !paymentInfo.length ? <ActivityIndicator size="large" color="#062b3d"></ActivityIndicator> : null}
            {showNoPaymentFlag ? <Text style={styles.emptyShipment}>No collection Data available !</Text>: null }

            {showDatePicker ? <DateTimePicker
                testID="dateTimePicker"
                value={globalDate.collectionDate.startTime}
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

export default collection;
const styles = StyleSheet.create({
    Card: {
        height: 140,
        borderRadius: 20,
        elevation: 10,
        backgroundColor: '#062b3d',
        color: 'white',
        paddingVertical: 20
    },
    cardText: {
        color: 'white',
        flex: 1,
        fontSize: 15,
        marginHorizontal: 10,
        fontWeight: 'bold'
    },
    cardHeader: {
        color: 'white',
        fontSize: 17,
        textAlign: 'center',
        fontWeight: 'bold'
    },
    cardBody: {
        flexDirection: 'row',
        marginVertical: 10,
        textAlign: 'center',
    },
    cardBody1: {
        flexDirection: 'row',
        textAlign: 'center',
    },
    cardText1: {
        color: 'white',
        marginLeft: 15,
        flex: 1,
        fontSize: 15,
        fontWeight: 'bold'
    },
    calendar: {
        fontSize: 18,
        color: 'white'
    },
    emptyShipment: {
        textAlign:'center',
        marginVertical:'30%',
        fontSize:17,
        color:'#062b3d'
    }
})
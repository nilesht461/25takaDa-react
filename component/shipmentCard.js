import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, Linking, TouchableOpacity, RefreshControl, ToastAndroid } from 'react-native';
import { Card, BottomSheet, ListItem } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getOrderDetails, getShopDetails, updateDelivery } from '../services/shipment';
import Spinner from 'react-native-loading-spinner-overlay';
import Geolocation from '@react-native-community/geolocation';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { Alert } from 'react-native';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
const ShipmentCard = ({ trips, navigation, loadData }) => {
    let [isVisible, setIsVisible] = useState(false);
    const state = useSelector(state => state);
    const dispatch = useDispatch();
    const [showBusy,setShowBusy] = useState(false);
    let [selectedTrip, setSelectedTrip] = useState(null);
    let [verification, setVerification] = useState({ docVerify: true, handshake: true, shopImage: true });
    const [spinner, setSpinner] = useState(false);
    let [isCancelVisible, setIsCancelVisible] = useState(false);
    const routeToDelivery = (trip) => {
        navigation.navigate('OrderDetails', { "data": trip })
    }
    const list = [
        {
            title: 'Cancel Order',
            onPress: () => {
                markOrderCancel('CANCELED')
                setIsCancelVisible(false);
            }
        },
        {
            title: 'Shop Closed',
            onPress: () => {
                markOrderCancel('SHOP_CLOSED');
                setIsCancelVisible(false);
            }
        },
        {
            title: 'Not Attempted',
            onPress: () => {
                markOrderCancel('NOT_ATTEMPTED');
                setIsCancelVisible(false);
            }
        },
        {
            title: 'Close',
            containerStyle: { backgroundColor: '#062b3d', color: 'grey' },
            titleStyle: { color: 'grey' },
            onPress: () => setIsCancelVisible(false),
        },
    ];
    const markOrderCancel = (status) => {
        Geolocation.getCurrentPosition(async (info) => {
            let data = {};
            if (selectedTrip.order.status == 'TRIP_CREATED') {
                data['status'] = "PACKED"
            }
            const sdata = {
                status: status,
                endTime: moment().toDate(),
                location: {
                    lat: info.coords.latitude,
                    lng: info.coords.longitude
                }
            }
            updateDelivery([], data, sdata, selectedTrip)
            setIsCancelVisible(false)
            ToastAndroid.showWithGravity(
                `Order status  marked as ${status}`,
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
            );
            updateState(status)
        },
        (error) => {
            ToastAndroid.showWithGravity(
                `Please enable Location permission`,
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
            );
        }
        )
    }
    const updateState = (type) => {
        let index = state.trips.activeTrips.findIndex(item => {
            return item.orderNo == selectedTrip.orderNo;
        })
            state.trips.activeTrips[index].status = type;
            state.trips.cancelledTrips = [state.trips.activeTrips[index], ...state.trips.cancelledTrips];
            state.trips.activeTrips.splice(index, 1);
            let trips = {
                'activeTrips': state.trips.activeTrips,
                'finishedTrips': state.trips.finishedTrips,
                'cancelledTrips': state.trips.cancelledTrips,
                'visibleTrips': state.trips.activeTrips
            }
            console.log(trips)
            dispatch({ type: 'updateTrips', payload: { trips: trips } })
            console.log(state.count.finishedTrips)
            let count = {
                'activeTrips': state.count.activeTrips - 1,
                'cancelledTrips': state.count.cancelledTrips + 1,
                'finishedTrips': state.count.finishedTrips
            }
            dispatch({ type: 'updateCount', payload: { count: count } })
    }
    const onOrderClick = async (trip) => {
        setSpinner(true);
        console.log('clicked');
        let aadharStatus = '';
        let panStatus = '';
        let shop = await getShopDetails(trip.shopId);
        let order = await getOrderDetails(trip.orderId);
        trip.order = order.data();
        trip.shop = shop.data();
        let verfication = { docVerify: true, handshake: true, shopImage: true };
        setVerification({ ...verification });
        let selectedTrip = { ...trip };
        setSpinner(false);
        // console.log(selectedTrip.shop.shopImage)
        setSelectedTrip(trip);
        if (selectedTrip.status != "ASSIGNED") {
            routeToDelivery(trip);
            return;
        }
        if (!trip.shop.shopImage) {
            // console.log('it ran ',trip.shop)
            verification.docVerify = true;
            setVerification({ ...verification, ['shopImage']: false });
            setIsVisible(true);
            return;
        }
        if (!selectedTrip.shop.verified && selectedTrip.order.creditUsed != 0) {
            verification.shopImage = true;
            setVerification({ ...verification, ['docVerify']: false });
            setIsVisible(true);
            return
        }
        if (!selectedTrip.shop.documents && selectedTrip.order.creditUsed != 0) {
            setVerification({ ...verification, ['docVerify']: false });
            setIsVisible(true);
            return
        }
        if (selectedTrip.shop.documents && selectedTrip.order.creditUsed != 0) {
            if (Object.keys(selectedTrip.shop.documents).length < 2 && selectedTrip.order.creditUsed != 0) {
                setVerification({ ...verification, ['docVerify']: false });
                setIsVisible(true);
                return
            }
            if (Object.keys(selectedTrip.shop.documents).length >= 2 && selectedTrip.order.creditUsed != 0) {
                for (var key in selectedTrip.shop.documents) {
                    if (selectedTrip.shop.documents.hasOwnProperty(key)) {
                        if (key == 'PAN') {
                            panStatus = selectedTrip.shop.documents[key].status
                        }
                        if (key == 'AADHAR') {
                            aadharStatus = selectedTrip.shop.documents[key].status
                        }
                    }
                }
            }
            if ((panStatus == 'PENDING' || panStatus == '') && (aadharStatus == 'PENDING' || aadharStatus == '') && selectedTrip.order.creditUsed != 0) {
                setVerification({ ...verification, ['docVerify']: false });
                setIsVisible(true);
                return
            }
        }
        if (selectedTrip.hasOwnProperty("handshake") && !selectedTrip.handshake) {
            setVerification({ ...verification, ['handshake']: false });
            setIsVisible(true);
            return
        }
        routeToDelivery(trip);
    }
    const navigateToShop = async(item) => {
        setSpinner(true);
        console.log(item)
        let shop = await getShopDetails(item.shopId);
        item.shop = shop.data();
        setSpinner(false);
        navigation.navigate('ShopDetail', { "data": item.shop, "orderNo": item.orderNo }) 
    }
    const renderItems = ({ item }) => {
        return (<Card containerStyle={styles.Card}>
            <Card.Title onPress={() => onOrderClick(item)} style={styles.title}>{item.orderNo}</Card.Title>
            <Card.Divider></Card.Divider>
            <Text style={styles.name} onPress={() => navigateToShop(item)}>{item.shopName}</Text>
            {item.shopDetails ? <Text style={styles.address}>{item.shopDetails.address.line1},{item.shopDetails.address.landmark},{item.shopDetails.address.city},{item.shopDetails.address.state},{item.shopDetails.address.pincode}</Text>:null}
            <View style={{ flexDirection: 'row',height:30 }}>
                <Text style={styles.number} onPress={() => Linking.openURL(`tel:${item.shopDetails.phoneNumber}`)}>Call Shop <Icon   name="phone" size={14} color="#3880ff" /></Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + item.shopDetails.location.lat + ',' + item.shopDetails.location.lng, '_system')}><Icon style={styles.icon} name="location-arrow"></Icon></TouchableOpacity>
            </View>
            {item.dsrName && item.dsrNumber ? 
            <View style={{flexDirection: 'row',marginBottom:7}}>
                <Text style={styles.dsr}>Sales Exec:- </Text>
                <Text style={styles.dsr1} >{item.dsrName}</Text>
                <TouchableOpacity style={{paddingHorizontal:4,borderWidth:1,borderRadius:5}} onPress={() => Linking.openURL(`tel:${item.dsrNumber}`)} >
                <Icon style={styles.call} name="phone" size={10} color="#062b3d" />
                </TouchableOpacity>
            </View> : null}
            <Text style={[styles.basic,item.status == 'ASSIGNED' ? styles.active: item.status == 'FINISHED' ? styles.finished : styles.canceled ]} >{item.status}</Text>     
             </Card>
        )
    }
    const switchToPod = () => {
        setIsVisible(false);
        selectedTrip.order.creditUsed = 0;
        let obj = { ...selectedTrip };
        navigation.navigate('OrderDetails', { "data": obj })
    }
    const cancelShipment = () => {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
            interval: 10000,
            fastInterval: 5000,
          })
            .then((data) => {
                if(data == "enabled" || data == "already-enabled") {
                    setIsVisible(false);
                    setIsCancelVisible(true)
                }
            })
            .catch((err) => {
             
            });
    }
    const refreshData = async() => {
        setShowBusy(true);
        await loadData();
        setShowBusy(false)
    }
    return (
        <View>
            <Spinner
                visible={spinner}
                textStyle={styles.spinnerTextStyle}
            />
            <FlatList
                refreshControl={
                    <RefreshControl
                        refreshing={showBusy}
                        onRefresh={() => refreshData()}
                    />}
                data={trips}
                style={{ flex: 0, marginBottom: 100 }}
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
                    <Icon name="close" style={styles.close} onPress={() => { setIsVisible(false); setVerification({ 'docVerify': true, shopImage: true, handshake: true }) }} size={24} color="#062b3d" />
                    {!verification.shopImage ? <TouchableOpacity onPress={() => { setIsVisible(false); navigation.navigate('ShopDetail', { "data": selectedTrip.shop, "orderNo": selectedTrip.orderNo }) }} style={[styles.button, { backgroundColor: '#062b3d' }]}><Text style={styles.buttonText}>Upload Shop Image</Text>
                    </TouchableOpacity> : null}
                    <View style={{ flexDirection: 'row' }}>
                        {!verification.docVerify ? <TouchableOpacity onPress={() => { setIsVisible(false); navigation.navigate('ShopDetail', { "data": selectedTrip.shop, "orderNo": selectedTrip.orderNo }) }} style={[styles.button, { backgroundColor: '#062b3d', flex: 1 }]}><Text style={styles.buttonText}>Upload Documents</Text>
                        </TouchableOpacity> : null}
                        {!verification.docVerify ? <TouchableOpacity onPress={() => { switchToPod() }} style={[styles.button, { backgroundColor: '#062b3d', flex: 1 }]}><Text style={styles.buttonText}>Switch to POD</Text>
                        </TouchableOpacity> : null}
                    </View>
                    <TouchableOpacity onPress={() => { cancelShipment() }} style={[styles.button, { backgroundColor: 'white', flex: 1, borderWidth: 1, borderColor: 'red' }]}><Text style={[styles.buttonText, { color: 'red' }]}>Cancel Shipment</Text>
                    </TouchableOpacity>
                    {!verification.shopImage ? <Text style={[styles.warning, { textAlign: 'center' }]}>Shop image is not available !</Text> : null}
                    {!verification.docVerify ? <Text style={styles.warning} s>₹{selectedTrip.order.creditUsed} credit used but documents not verified</Text> : null}
                </View>
            </BottomSheet>
            <BottomSheet
                isVisible={isCancelVisible}
                containerStyle={{ backgroundColor: 'rgba(0.5, 0.25, 0, 0.2)' }}
            >
                {list.map((l, i) => (
                    <ListItem key={i} containerStyle={l.containerStyle} onPress={l.onPress}>
                        <ListItem.Content>
                            <ListItem.Title style={l.titleStyle}>{l.title}</ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                ))}
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
    dsr: {
        fontSize: 15,
        color: 'grey'
    },
    dsr1: {
        fontSize: 15,
        marginHorizontal: 5,
        color: '#062b3d'
    },
    basic: {
        fontSize: 13,
        paddingHorizontal: 5,
        paddingVertical: 3,
        color: 'white',
        width:'23%',
        borderRadius: 5,
        flex:1,
        textTransform: 'capitalize',
    },
    active: {
        backgroundColor: 'green',
    },
    finished: {
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
        marginTop: 40,
        borderRadius: 10
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 1.1
    },
    bottomMenu: {
        height: '100%',
        width: '100%',
        backgroundColor: 'white'
    },
    close: {
        left: '90%',
        paddingVertical: 10,
        paddingEnd: 10,
        elevation: 10
    },
    warning: {
        marginHorizontal: "7%",
        marginVertical: '5%',
        fontWeight: 'bold'
    },
    spinnerTextStyle: {
        color: '#062b3d'
    },
})

export default ShipmentCard;
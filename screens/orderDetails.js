import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native';
import {getFinishedShipmentsByDate, getOrderDetails, getShipments, getShopDetails,getActiveShipmentsByDate} from '../services/shipment';
import { ScrollView } from 'react-native';
import { View, StyleSheet, Text, FlatList,ToastAndroid } from 'react-native';
import { Card, Input,ListItem,BottomSheet } from 'react-native-elements';
import { withOrientation } from 'react-navigation';
import { getOrderItems,getDAappUtils } from '../services/shipment'
import Geolocation from '@react-native-community/geolocation';
import {updateDelivery} from '../services/shipment';
import { useDispatch,useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import moment from 'moment';
import Spinner from 'react-native-loading-spinner-overlay';
import {updateCount, updateTrips} from '../services/helper';
const OrderDetails = ({ navigation }) => {
    const trip = navigation.getParam('data', {});
    const state = useSelector(state => state);
    let showPayLater = false;
    let [products, setProducts] = useState([]);
    const [user,setUser] = useState(auth().currentUser);
    let [cancelReason,setCancelReason] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    let [da_app_utils,setDAapputils] = useState({});
    const dispatch = useDispatch();
        const list = [
        {title:'Cancel Order',
        onPress : () => {
            setCancelReason('CANCELED');
            markOrderCancel('CANCELED')
            setIsVisible(false);
        }
        },
        { title: 'Shop Closed',
        onPress : () => {
            setCancelReason('SHOP_CLOSED');
            markOrderCancel('SHOP_CLOSED');
            setIsVisible(false);
        } 
        },
        { title: 'Not Attempted',
        onPress : () => {
            setCancelReason('NOT_ATTEMPTED');
            markOrderCancel('NOT_ATTEMPTED');
            setIsVisible(false);
        }
        },
        {
            title: 'Close',
            containerStyle: { backgroundColor: '#062b3d',color:'grey' },
            titleStyle: { color: 'grey' },
            onPress: () => setIsVisible(false),
        },
    ];
    useEffect(async () => {
      
       let  productData = await getOrderItems(trip.order.orderId);
       let da_app_util_data = await getDAappUtils();
       da_app_utils = da_app_util_data.data();
       setDAapputils(da_app_utils);
        productData.forEach(element => {
            products.push(element.data());
            setProducts([...products]);
            if (element.data().noCredit) {
                showPayLater = true;
            }
        });
    }, [])
    const markOrderCancel = (status) => {
        Geolocation.getCurrentPosition(async(info) =>  {
            let data = {};
            if(trip.order.status == 'TRIP_CREATED') {
              data['status'] = "PACKED"
            }
            const sdata = {
              status: status,
              endTime: moment().toDate(),
              location: {
                  lat: info.coords.latitude,
                  lng:info.coords.longitude
              }
            }
            updateOrder(data, sdata)
            ToastAndroid.showWithGravity(
                `Order status  marked as ${status}`,
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
              );
            updateState('cancelled')
            navigation.goBack();
            
        })
    }
    const updateState=(type) => {
        let index = state.trips.activeTrips.findIndex(item => {
            return item.orderNo == trip.orderNo;
        })
        if(type == 'cancelled') {
        state.trips.activeTrips[index].status = 'CANCELED';
        state.trips.cancelledTrips = [state.trips.activeTrips[index],...state.trips.cancelledTrips ];
        state.trips.activeTrips.splice(index,1);
        let trips = {
            'activeTrips':state.trips.activeTrips,
            'finishedTrips': state.trips.finishedTrips,
            'cancelledTrips':  state.trips.cancelledTrips,
            'visibleTrips': state.trips.activeTrips
        }
        console.log(trips)
        dispatch({type: 'updateTrips',payload:{trips:trips}})
        console.log(state.count.finishedTrips)
        let count =  {
            'activeTrips': state.count.activeTrips -1,
            'cancelledTrips': state.count.cancelledTrips + 1,
            'finishedTrips': state.count.finishedTrips
        }
        dispatch({type: 'updateCount',payload:{count:count}})
    }
    if(type == 'finished') {
        state.trips.activeTrips[index].status = 'FINISHED';
        state.trips.finishedTrips = [state.trips.activeTrips[index],...state.trips.finishedTrips];
        state.trips.activeTrips.splice(index,1);
        let trips = {
            'activeTrips':state.trips.activeTrips,
            'finishedTrips': state.trips.finishedTrips,
            'cancelledTrips':  state.trips.cancelledTrips,
            'visibleTrips': state.trips.activeTrips
        }
        console.log(trips)
        dispatch({type: 'updateTrips',payload:{trips:trips}})
        console.log(state.count.finishedTrips)
        let count =  {
            'activeTrips': state.count.activeTrips -1,
            'cancelledTrips': state.count.cancelledTrips,
            'finishedTrips': state.count.finishedTrips + 1
        }
        dispatch({type: 'updateCount',payload:{count:count}})
    }
}
    const renderItems = ({ item }) => {
        return (<View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemDetail} style={{ flexDirection: 'row' }}>
                <Text style={{ flex: 1, color: 'grey' }}>Qty : {item.totalQty}</Text>
                <Text style={{ flex: 1, color: 'grey' }}>MRP : ₹{item.mrp}</Text>
            </View>
        </View>

        )
    }
    const updateOrder = (data, sdata) =>  {
        updateDelivery([], data,sdata,trip.order)
      }
    const   markDelivered = async() => {
        if (trip.order.paymentStatus === 'COD' || trip.order.pendingAmount > trip.order.creditUsed) {
            navigation.navigate('Payment', { data: trip, showPayLater: showPayLater,da_app_utils : da_app_utils })
        } else {
          Geolocation.getCurrentPosition(async(resp) => {
            let location = {};
            location.lat =  resp.coords.latitude;
            location.lng = resp.coords.longitude
            const data = {
              status: "DELIVERED",
              deliveredAt: moment().toDate()
            }
      
            const sdata = {
              status: "FINISHED",
              endTime: moment().toDate(),
              location: location
            }
            updateOrder(data, sdata);
            updateState('finished')
            ToastAndroid.showWithGravity(
                `Order successfully  marked as Delivered`,
                ToastAndroid.LONG,
                ToastAndroid.CENTER
              );
            
            navigation.navigate('Trips');

          })
        }
      }
    return (
        <View style={{ flexDirection: 'column', flex: 1 }}>
            <Card containerStyle={styles.Card}>
                <Card.Title style={{ color: '#3880ff', textAlign: 'left' }}>{trip.orderNo}</Card.Title>
                <Card.Divider></Card.Divider>
                <Text style={styles.name}>{trip.shop.name}</Text>
                <Text style={styles.address}>{trip.order.deliveryAddress.line1},{trip.order.deliveryAddress.landmark},{trip.order.deliveryAddress.city},{trip.order.deliveryAddress.state},{trip.order.deliveryAddress.pincode}</Text>
                {trip.order.creditUsed && trip.status =='ASSIGNED' ? <Text style={styles.payment}>Credit used :- ₹{Math.floor(trip.order.creditUsed).toFixed(0)}</Text> : null}
                {trip.order.paymentStatus  == 'COD' && trip.status =='ASSIGNED'  || trip.order.pendingAmount > trip.order.creditUsed && trip.status =='ASSIGNED'  ?
                    <Text style={styles.payment}>Collect on Delivery :- ₹{Math.floor(trip.order.receivableAmount - trip.order.creditUsed).toFixed(0)}</Text> : null
                } 
            </Card>
            <Card containerStyle={{ flex: 1, borderRadius: 10, elevation: 10, paddingBottom: 30 }}>
                <Card.Title style={{ color: '#3880ff', textAlign: 'left' }}>Products</Card.Title>
                <Card.Divider></Card.Divider>
                {products.length ? <FlatList
                    //   refreshControl={
                    //     <RefreshControl
                    //     refreshing={showBusy}
                    //     onRefresh={getData}
                    //    />
                    //    }
                    data={products}
                    renderItem={renderItems}
                    keyExtractor={(item, index) => index.toString()}
                    nesscrollEnabled={true}
                    nestedScrollEnabled={true}
                    style={{ marginBottom: 30 }}
                // onEndReached={loadMore}
                />
                    : <ActivityIndicator size="large" color="#062b3d"></ActivityIndicator>}
            </Card>
            {products.length && trip.status == 'ASSIGNED' ? <View style={{ flexDirection: 'row', marginVertical: 10 }}>
                <TouchableOpacity onPress={() =>  setIsVisible(true)} style={[styles.button]}><Text style={styles.buttonText}>CANCEL</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => markDelivered()} style={[styles.button, { backgroundColor: '#062b3d' }]}><Text style={styles.buttonText}>DELIVER</Text></TouchableOpacity>
            </View>
                : null}
            
            <BottomSheet
                isVisible={isVisible}
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
        flex: 0,
    },
    name: {
        color: 'grey',
        fontSize: 14,
        marginTop: -5,
        fontWeight: 'bold'
    },
    address: {
        fontSize: 14,
        marginVertical: 5,
        color: 'grey'
    },
    number: {
        fontSize: 15,
        marginVertical: 5,
        color: '#3880ff'
    },
    payment: {
        color: 'red',
        fontWeight: 'bold',
        fontSize: 15
    },
    item: {
        padding: 7,
        elevation: 5
    },
    itemName: {
        color: 'grey',
        fontSize: 15,
        paddingVertical: 3
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: 'grey',
        marginHorizontal: 10,
        borderRadius: 10
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 1.1
    },
    spinnerTextStyle: {
        color: '#FFF'
      },
})
export default OrderDetails;
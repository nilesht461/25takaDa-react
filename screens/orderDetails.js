import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal } from 'react-native';
import { TouchableOpacity } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { getFinishedShipmentsByDate, getOrderDetails, addComment, getShipments, getShopDetails, getActiveShipmentsByDate } from '../services/shipment';
import { ScrollView } from 'react-native';
import { View, StyleSheet, Text, FlatList, ToastAndroid } from 'react-native';
import { Card, Input, ListItem, BottomSheet } from 'react-native-elements';
import { withOrientation } from 'react-navigation';
import { getOrderItems, getDAappUtils } from '../services/shipment'
import Geolocation from '@react-native-community/geolocation';
import { updateDelivery } from '../services/shipment';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Spinner from 'react-native-loading-spinner-overlay';
import { updateCount, updateTrips } from '../services/helper';
import { Alert } from 'react-native';
import { LogBox } from 'react-native';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
const OrderDetails = ({ navigation }) => {
    const trip = navigation.getParam('data', {});
    const state = useSelector(state => state);
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    let [modalVisible, setModalVisible] = useState(false);
    let [commentData,setCommentData] = useState(trip.order.comments)
    let showPayLater = false;
    let [comment, setComment] = useState('');
    let [products, setProducts] = useState([]);
    const [user, setUser] = useState(auth().currentUser);
    let [cancelReason, setCancelReason] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [showBusy, setShowBusy] = useState(false);
    let [da_app_utils, setDAapputils] = useState({});
    const dispatch = useDispatch();
    const list = [
        {
            title: 'Cancel Order',
            onPress: () => {
                setCancelReason('CANCELED');
                markOrderCancel('CANCELED')
                setIsVisible(false);
            }
        },
        {
            title: 'Shop Closed',
            onPress: () => {
                setCancelReason('SHOP_CLOSED');
                markOrderCancel('SHOP_CLOSED');
                setIsVisible(false);
            }
        },
        {
            title: 'Not Attempted',
            onPress: () => {
                setCancelReason('NOT_ATTEMPTED');
                markOrderCancel('NOT_ATTEMPTED');
                setIsVisible(false);
            }
        },
        {
            title: 'Close',
            containerStyle: { backgroundColor: '#062b3d', color: 'grey' },
            titleStyle: { color: 'grey' },
            onPress: () => setIsVisible(false),
        },
    ];
    
    useEffect(async () => {

        let productData = await getOrderItems(trip.order.orderId);
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
    const cancelShipment = () => {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
            interval: 10000,
            fastInterval: 5000,
          })
            .then((data) => {
                if(data == "enabled" || data == "already-enabled") {
                    setIsVisible(true);
                }
            })
            .catch((err) => {
             
            });
    }
    const markOrderCancel = (status) => {
        Geolocation.getCurrentPosition(async (info) => {
            let data = {};
            if (trip.order.status == 'TRIP_CREATED') {
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
            updateOrder(data, sdata)
            ToastAndroid.showWithGravity(
                `Order status  marked as ${status}`,
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
            );
            updateState(status)
            navigation.goBack();

        }, (error) => {
            ToastAndroid.showWithGravity(
                `Please enable Location permission`,
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
            );
        })
    }
    const updateState = (type) => {
        let index = state.trips.activeTrips.findIndex(item => {
            return item.orderNo == trip.orderNo;
        })
        state.trips.activeTrips[index].status = type;
        if (type != 'FINISHED') {
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
        if (type == 'FINISHED') {
            state.trips.finishedTrips = [state.trips.activeTrips[index], ...state.trips.finishedTrips];
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
                'cancelledTrips': state.count.cancelledTrips,
                'finishedTrips': state.count.finishedTrips + 1
            }
            dispatch({ type: 'updateCount', payload: { count: count } })
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
    const renderComments = ({ item }) => {
        return (<View style={styles.item}>
            <Text style={styles.itemName}>{item.text} --- {moment(item.timestamp).format("DD/MM/YYYY")}</Text>
        </View>

        )
    }
    const updateOrder = (data, sdata) => {
        updateDelivery([], data, sdata, trip)
    }
    const markDelivered = async () => {
        if (trip.order.paymentStatus === 'COD' || trip.order.pendingAmount > trip.order.creditUsed) {
            navigation.navigate('Payment', { data: trip, showPayLater: showPayLater, da_app_utils: da_app_utils })
        } else {
            RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
                interval: 10000,
                fastInterval: 5000,
              })
                .then((data) => {
                    if(data == "enabled" || data == "already-enabled") {
                        Geolocation.getCurrentPosition(async (resp) => {
                            let location = {};
                            location.lat = resp.coords.latitude;
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
                            updateState('FINISHED')
                            ToastAndroid.showWithGravity(
                                `Order successfully  marked as Delivered`,
                                ToastAndroid.LONG,
                                ToastAndroid.CENTER
                            );
            
                            navigation.navigate('Trips');
            
                        },
                            (error) => {
                                ToastAndroid.showWithGravity(
                                    `Please enable Location permission`,
                                    ToastAndroid.LONG,
                                    ToastAndroid.CENTER
                                );
                            })
                    }
                })
                .catch((err) => {
                 
                });
        }
    }
    const submitComment = async () => {
        setShowBusy(true);
        let obj = {
            userId: auth().currentUser.uid,
            timestamp: new Date(),
            text: comment
        };
        commentData = [...commentData,obj];
        setCommentData(commentData)
        await addComment({ "orderId": trip.orderId, 'comments': firestore.FieldValue.arrayUnion(obj) });
        setShowBusy(false);
        setModalVisible(false);
        comment = ''
        setComment(comment);
        ToastAndroid.showWithGravity(
            `Comment added successfully .`,
            ToastAndroid.SHORT,
            ToastAndroid.CENTER
        );

        

    }
    return (
        <View style={{ flexDirection: 'column', flex: 1 }}>
            {products.length ? <ScrollView>
                <Card containerStyle={styles.Card}>
                    <Card.Title style={{ color: '#3880ff', textAlign: 'left' }}>{trip.orderNo}</Card.Title>
                    <Card.Divider></Card.Divider>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.name}>{trip.shop.name}</Text>
                        <TouchableOpacity onPress={() => { setModalVisible(true) }} >
                            <MaterialIcon style={styles.comment} name="message"></MaterialIcon>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.address}>{trip.order.deliveryAddress.line1},{trip.order.deliveryAddress.landmark},{trip.order.deliveryAddress.city},{trip.order.deliveryAddress.state},{trip.order.deliveryAddress.pincode}</Text>
                    {trip.order.creditUsed && trip.status == 'ASSIGNED' ? <Text style={styles.payment}>Credit used :- ₹{Math.floor(trip.order.creditUsed).toFixed(0)}</Text> : null}
                    {trip.order.paymentStatus == 'COD' && trip.status == 'ASSIGNED' || trip.order.pendingAmount > trip.order.creditUsed && trip.status == 'ASSIGNED' ?
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
                <Card containerStyle={{ flex: 1, borderRadius: 10, elevation: 10, paddingBottom: 30 }}>
                    <Card.Title style={{ color: '#3880ff', textAlign: 'left' }}>comments</Card.Title>
                    <Card.Divider></Card.Divider>
                    {commentData?.length ? <FlatList
                        data={commentData}
                        renderItem={renderComments}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ marginBottom: 10 }}
                    // onEndReached={loadMore}
                    />
                        : <Text style={{ color: 'grey' }}>No comments added for this order</Text>}
                </Card>
            </ScrollView> : <ActivityIndicator style={{top:'40%'}} size="large" color="#062b3d" />}
            {products.length && trip.status == 'ASSIGNED' ? <View style={{ flexDirection: 'row', marginVertical: 10 }}>
                <TouchableOpacity onPress={() => cancelShipment()} style={[styles.button]}><Text style={styles.buttonText}>CANCEL</Text></TouchableOpacity>
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
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            >
                <View style={{
                    flex: 1,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#00000080',
                    // borderRadius:20,
                }}>
                    <View style={{
                        width: '90%',
                        height: '30%',
                        borderRadius: 20,
                        // flexDirection:'column',
                        backgroundColor: '#fff'
                    }}>
                        <ScrollView>
                        <View style={{ marginTop: 30, width: '90%', left: '5%'}}>
                            <Input style={styles.input} name="comment" value={comment} onChangeText={(e) => setComment(e)} placeholder='type message' />
                            {!showBusy ? <TouchableOpacity onPress={() => { submitComment() }} style={[styles.button, { backgroundColor: '#062b3d', flex: 0 }]}><Text style={styles.buttonText}>SAVE</Text></TouchableOpacity>
                                : <ActivityIndicator size="large" color="#062b3d" />}
                        </View>
                        </ScrollView>
                    </View>
                </View>
                
            </Modal>
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
        fontWeight: 'bold',
        flex: 1,
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
    comment: {
        fontSize: 25,
        color: '#062b3d',
        padding: 0,
        elevation: 0,
        marginTop: -5,
        marginRight: '30%'

    },
})
export default OrderDetails;
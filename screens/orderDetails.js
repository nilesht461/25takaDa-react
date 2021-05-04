import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native';
import { View, StyleSheet, Text, FlatList,ToastAndroid } from 'react-native';
import { Card, Input,ListItem,BottomSheet } from 'react-native-elements';
import { withOrientation } from 'react-navigation';
import { getOrderItems } from '../services/shipment'
import Geolocation from '@react-native-community/geolocation';
import {updateDelivery} from '../services/shipment';
import moment from 'moment';
const OrderDetails = ({ navigation }) => {
    const trip = navigation.getParam('data', {});
    let showPayLater = false;
    let [products, setProducts] = useState([]);
    let [cancelReason,setCancelReason] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const list = [
        {title:'order canceled',
        onPress : () => {
            setCancelReason('CANCELED');
            markOrderCancel('CANCELED')
            setIsVisible(false);
        }
        },
        { title: 'Shop closed',
        onPress : () => {
            setCancelReason('SHOP_CLOSED');
            markOrderCancel('SHOP_CLOSED');
            setIsVisible(false);
        } 
        },
        { title: 'Not attempted',
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
                ToastAndroid.LONG,
                ToastAndroid.CENTER
              );
            navigation.goBack();
        })
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
    const   markDelivered = () => {
        if (trip.order.paymentStatus === 'COD' || trip.order.pendingAmount > trip.order.creditUsed) {
            navigation.navigate('Payment', { data: trip, showPayLater: showPayLater })
        } else {
          Geolocation.getCurrentPosition((resp) => {
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
            navigation.goBack()
          })
          ToastAndroid.showWithGravity(
            `Order successfully  marked as Delivered`,
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
        navigation.navigate('Trips');
        }
      }
    return (
        <View style={{ flexDirection: 'column', flex: 1 }}>
            <Card containerStyle={styles.Card}>
                <Card.Title style={{ color: '#3880ff', textAlign: 'left' }}>{trip.orderNo}</Card.Title>
                <Card.Divider></Card.Divider>
                <Text style={styles.name}>{trip.shop.name}</Text>
                <Text style={styles.address}>{trip.order.deliveryAddress.line1},{trip.order.deliveryAddress.landmark},{trip.order.deliveryAddress.city},{trip.order.deliveryAddress.state},{trip.order.deliveryAddress.pincode}</Text>
                {trip.order.creditUsed ? <Text style={styles.payment}>Credit used :- ₹{Math.floor(trip.order.creditUsed).toFixed(0)}</Text> : null}
                {trip.order.paymentStatus == 'COD' || trip.order.pendingAmount > trip.order.creditUsed ?
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
            {products.length ? <View style={{ flexDirection: 'row', marginVertical: 10 }}>
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
    }
})
export default OrderDetails;
import React from 'react';
import { View, StyleSheet, Text, FlatList, Linking, TouchableOpacity } from 'react-native';
import { Card,ListItem,BottomSheet } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
const PaymentCard = ({ paymentInfo, navigation }) => {

    const renderItems = ({ item }) => {
        return (<Card containerStyle={styles.Card}>
            <Card.Title  style={styles.title}>{item.orderNo}</Card.Title>
            <Card.Divider></Card.Divider>
            <Text style={styles.name} >{item.shop.name}</Text> 
            <Text style={styles.address}>{item.shop.address.line1},{item.shop.address.landmark},{item.shop.address.city},{item.shop.address.state},{item.shop.address.pincode}</Text>
            <View style={{flexDirection:'row'}}>
            <Text style={styles.number}>₹{item.amount}</Text>
            <Text style={styles.active}>{item.mode}</Text>
          </View>
        </Card>
        
        )
    }
    return (
        <View>
            <FlatList
                //   refreshControl={
                //     <RefreshControl
                //     refreshing={showBusy}
                //     onRefresh={getData}
                //    />
                //    }
                style={{flex:0,marginBottom:140}}
                data={paymentInfo}
                renderItem={renderItems}
                keyExtractor={(item, index) => index.toString()}
            // onEndReached={loadMore}
            // onEndReachedThreshold={0}
            />
        </View>
    )
};
const styles = StyleSheet.create({
    Card: {
        borderRadius: 10,
        elevation: 10,
        flex: 1,
        marginBottom:20
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
        marginVertical: 0,
        color: '#3880ff',
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
    active: {
        fontSize: 13,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: 'green',
        color: 'white',
        width: 'auto',
        borderRadius: 5,
        flex: 0,
        textTransform: 'capitalize',
        marginHorizontal:20
    },
})

export default PaymentCard;
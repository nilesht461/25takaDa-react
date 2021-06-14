import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert,ToastAndroid, Image } from 'react-native';
import { Picker } from '@react-native-community/picker';
import { Card, Input } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';
import { ScrollView } from 'react-native';
import moment from 'moment';
import Geolocation from '@react-native-community/geolocation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import UploadPhoto from '../services/uploadPhoto';
import {updateCount,updateTrips} from '../services/helper';
import { useDispatch,useSelector } from 'react-redux';
import {updateDelivery} from '../services/shipment';
import Spinner from 'react-native-loading-spinner-overlay';
import { LogBox } from 'react-native';
import { addTransactions, updateQRCode, updateSignature, getUpiPaymentStatus } from '../services/shipment';
const Payments = ({ navigation }) => {
    const trip = navigation.getParam('data', {});
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    const state = useSelector(state => state);
    let [txnId, setTxnId] = useState(null);
    let [spinner,setSpinner] = useState(false);
    const dispatch = useDispatch();
    const showPayLater = navigation.getParam('showPayLater', false);
    const da_app_utils = navigation.getParam('da_app_utils', {});
    // console.log(da_app_utils)
    const [user, setUser] = useState(auth().currentUser);
    let [saveLoader,setSaveLoader] = useState(false)
    const [showBusy, setShowBusy] = useState(false);
    const [verify, setVerify] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
    const [date, setDate] = useState(moment().format("DD/MM/YYYY"));
    const [showDatePicker, setShowDatePicker] = useState(false);
    let [amount, setAmount] = useState(Math.floor(trip.order.receivableAmount - trip.order.creditUsed))
    let [loader, setLoader] = useState(false);
    let [inputAmount, setInputAmount] = useState(`${Math.floor(trip.order.receivableAmount - trip.order.creditUsed)}`)
    let [paymentData, setPaymentData] = useState([]);
    let [chequeData, setChequeData] = useState({ number: '', bank: '', date: date, image: '' });
    let [barcode, setBardCode] = useState(null);
    let [chequeDate,setChequeDate] = useState(moment(new Date()).toDate());
    console.log(chequeDate)
    const addPayment = async () => {
        if (amount <= 0) {
            alert("enter a valid amount")
            return
        }
        if (Number(inputAmount) > amount) {
            alert("enter a valid amount")
            return;
        }
        // console.log("clcikefd");
        let paymentInfo = {
            orderId: trip.order.orderId,
            shopId: trip.order.shopId,
            retailerId: trip.order.orderedBy,
            orderNo: trip.order.id,
            amount: Number(inputAmount),
            mode: selectedPaymentMethod,
            timestamp: new Date(),
            addedBy: user.uid,
            trxnStatus: "SUCCESS",
            type: "CREDIT",
        }
        if (selectedPaymentMethod == "CHEQUE") {
            if (chequeData.number == '' || chequeData.bank == '' || chequeData.image == '') {
                alert("Please enter the valid cheque details");
                return;
            }
            paymentInfo["cheque"] = {
                bank: chequeData.bank.toUpperCase(),
                number: chequeData.number,
                date: chequeDate,
                image: chequeData.image
            }
            paymentInfo["trxnStatus"] = "PENDING";
        }
        if (selectedPaymentMethod == 'UPI') {
            setVerify(true);
            if (barcode == null) {
                alert('First generate a valid barcode.');
                setVerify(false);
                return;
            }
            let upiData = await getUpiPaymentStatus(txnId);
            // console.log(upiData);
            if (upiData.txStatus == 'SUCCESS') {
                if (inputAmount == Math.floor(trip.order.receivableAmount - trip.order.creditUsed)) {
                    alert('full payment made via UPI');
                    setBardCode(null);
                    setSaveLoader(true)
                    setVerify(false);
                    paymentApi();
                    return;
                } else {
                    alert(`payment of Rs ${inputAmount} made via UPI`);
                    setBardCode(null);

                }
            } else {
                alert('payment No successfull');
                setVerify(false)
                return;
            }
            setVerify(false);
        }
        setInputAmount(`${amount - inputAmount}`);
        setAmount(amount - inputAmount);
        paymentData.push(paymentInfo);
        setPaymentData([...paymentData]);
        // console.log(paymentInfo);
        setChequeData({ number: '', bank: '', date: '', image: '' })
    }
    const removePayment = (p) => {
        const index = paymentData.indexOf(p)
        if (index > -1) {
            amount = Number(amount) + Number(p.amount)
            // console.log(amount)
            setAmount(`${amount}`)
            setInputAmount(`${amount}`)
            paymentData.splice(index, 1)
        }
    }
    const onCalendarChange = (event, date) => {
        setShowDatePicker(false);
        setChequeDate(moment(date).toDate());
        // console.log(moment(date).toDate());
        setDate(moment(date).format("DD/MM/YYYY"));
    }
    const takePicture = async () => {
        let options = {
            mediaType: 'photo',
            cameraType: 'back',
            quality: 0.7,
            maxWidth: 1240,
            maxHeight: 780,
            storageOptions: {
              skipBackup: true
            }

        };
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("Camera permission given");
                launchCamera(options, async (response) => {
                    if (response.uri) {
                        setChequeData({ ...chequeData, ['image']: '' });
                        setShowBusy(true);
                        let data = await UploadPhoto(response, chequeData.number);
                        setChequeData({ ...chequeData, ['image']: data });
                        setShowBusy(false)
                    }

                });
            } else {
                console.log("Camera permission denied");
            }
        } catch (err) {
            console.warn(err);
        }

    };
    const renderItems = ({ item }) => {
        return (<Card containerStyle={[styles.card]}>
            <View style={styles.item}>
                <Text style={{ flex: 1 }}>₹{item.amount}</Text>
                <Text style={{ flex: 1, color: 'grey' }}>{item.mode}</Text>
                <Icon name='close' style={{ paddingHorizontal: 10 }} size={18} color='#062b3d' onPress={() => removePayment(item)} />
            </View>
        </Card>

        )
    }
    const handleChange = (data) => {
        setInputAmount(data);
    }
    const handleFormChange = (text, name) => {

        setChequeData({
            ...chequeData,
            [name]: text
        });
    };
    const getQRcode = async () => {
        setBardCode(null)
        setLoader(true);
        let obj = {
            orderId: trip.order.orderId,
            shopId: trip.shop.shopId,
            amount: Number(inputAmount),
            status: 'SUCCESS',
            userId: user.uid
        }
        let tempId = await addTransactions(obj);
        setTxnId(tempId);
        getSignature(tempId);

    }
    const getSignature = async (value) => {
        // console.log(value)
        let data = {
            "appId": "93757908255e9b518fcf1a3be75739",
            "orderId": value,
            "orderAmount": `${inputAmount}`,
            "orderCurrency": "INR",
            "customerName": `${trip.order.shopName} | ${trip.orderNo}`,
            "customerPhone": trip.shop.contacts[0].phone,
            "customerEmail": da_app_utils.upi.email,
            "notifyUrl": da_app_utils.upi.notifyUrl,
            "responseType": "json",
            "paymentOption": "upi",
            "upiMode": "qrcode"
        }
        // console.log(data)
        let signature = await updateSignature(data);
        getBarCode(signature, value)
    }
    const getBarCode = async (signature, value) => {
        console.log("it ran");
        let data = {
            "appId": "93757908255e9b518fcf1a3be75739",
            "orderId": value,
            "orderAmount": `${inputAmount}`,
            "orderCurrency": "INR",
            "customerName": `${trip.order.shopName} | ${trip.orderNo}`,
            "customerPhone": trip.shop.contacts[0].phone,
            "customerEmail": da_app_utils.upi.email,
            "notifyUrl": da_app_utils.upi.notifyUrl,
            "responseType": "json",
            "paymentOption": "upi",
            "upiMode": "qrcode",
            signature: signature
        }
        let barcodeData = await updateQRCode(data);
        setBardCode(barcodeData.data.qr);
        setLoader(false)
    }
    const saveData = async () => {
        let totalAmount = 0;
        for (let i = 0; i < paymentData.length; i++) {
            totalAmount = totalAmount + paymentData[i].amount;
            if(paymentData[i].mode == 'UPI'){
                paymentData.splice(i,1);
            }
        }
        totalAmount = Math.round(totalAmount);
        setSaveLoader(true)
        Alert.alert(
            "25taka",
            `Please make sure that you have  collected ₹${totalAmount}`,
            [
                {
                    text: "Cancel",
                    onPress: () => setSaveLoader(false),
                    style: "cancel"
                },
                {
                    text: "OK", onPress: async () => {
                        paymentApi();
                    }
                }
            ])

    }
    const paymentApi = () => {
        Geolocation.getCurrentPosition(async(resp) => {
            // setSaveLoader(true);
            let location = {};
            location.lat = resp.coords.latitude;
            location.lng = resp.coords.longitude
            const data = {
                status: "DELIVERED",
                deliveredAt: moment().toDate()
            }
            const shipmentData = {
                status: "FINISHED",
                endTime: moment().toDate(),
                location: location
            }
            // console.log(paymentData);
            await updateDelivery(paymentData, data, shipmentData, trip);
            // setSaveLoader(false);
            ToastAndroid.showWithGravity(
                `OrderNo. ${trip.orderNo} successfully  marked as Delivered`,
                ToastAndroid.LONG,
                ToastAndroid.CENTER
              );
            updateState('finished')
            navigation.navigate('Trips');
        })
    }
    const updateState=(type) => {
        let index = state.trips.activeTrips.findIndex(item => {
            return item.orderNo == trip.orderNo;
        })
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
    return (
        <View style={{ flexDirection: 'column', flex: 1 }}>
            <ScrollView>
            <Card containerStyle={styles.card}>
                <Text style={styles.payment}>Payable Amount : ₹{Math.floor(trip.order.receivableAmount - trip.order.creditUsed).toFixed(2)} </Text>
            </Card>
            <Card containerStyle={[styles.card, { flex: 1, paddingBottom: '20%' }]}>
                <Card.Title>Payment Info</Card.Title>
                <Card.Divider></Card.Divider>
                {amount > 0 &&
                    <ScrollView>
                        <View>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#062b3d', flex: 1, marginTop: 14 }}>Payment Mode   :- </Text>
                                <Picker
                                    selectedValue={selectedPaymentMethod}
                                    style={{ height: 50, width: 150, color: 'red' }}
                                    onValueChange={(itemValue, itemIndex) => setSelectedPaymentMethod(itemValue)}
                                >
                                    <Picker.Item style={{ fontWeight: 'bold' }} label="UPI" value="UPI" />
                                    <Picker.Item label="CASH" value="CASH" />
                                    <Picker.Item label="CHEQUE" value="CHEQUE" />

                                </Picker>
                            </View>
                            <View>
                                <Input name="amounttotal" value={inputAmount} onChangeText={(e) => handleChange(e)} leftIcon={<Icon name='rupee' size={18} color='#062b3d' />}
                                    rightIcon={selectedPaymentMethod == 'UPI' && !loader ? <Icon onPress={getQRcode} style={styles.barcode} name="barcode"></Icon> :
                                        selectedPaymentMethod == 'UPI' && loader ? <ActivityIndicator size="small" color="#062b3d" /> : null} />
                            </View>
                            {selectedPaymentMethod == 'UPI' && barcode != null && !loader ? <Image style={styles.qrImage} source={{ uri: barcode }} /> :
                                selectedPaymentMethod == 'UPI' && barcode == null && loader ? <ActivityIndicator style={styles.loader} size="large" color='#062b3d' />
                                    : null
                            }
                            {selectedPaymentMethod == 'CHEQUE' &&
                                <View>
                                    <Input  label="Enter Cheque number" placeholder="Enter Cheque number" labelStyle={styles.label} name="chequeNumber" value={chequeData.number} onChangeText={(e) => handleFormChange(e, 'number')} leftIcon={<Icon name='money' size={18} color='grey' />}
                                    />
                                    <Input labelStyle={styles.label}  label="Enter Bank name" placeholder="Enter Bank name" name="BankName" value={chequeData.bank} onChangeText={(e) => handleFormChange(e, 'bank')} leftIcon={<Icon name='bank' size={18} color='grey' />}
                                    />
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{flexDirection:'column'}}>
                                         <Text style={{color:'grey',marginLeft: 15,marginBottom:5}}>Cheque Date</Text>
                                        <Text style={styles.date} onPress={() => { setShowDatePicker(true) }}>{date}<Icon style={styles.calendar} name="calendar"></Icon></Text>
                                        </View>
                                        <TouchableOpacity onPress={() => takePicture()} style={[styles.takePicture, { backgroundColor: '#062b3d' }]}><Text style={styles.buttonText}>Upload Image</Text></TouchableOpacity>
                                    </View>
                                    {showBusy == true ? <ActivityIndicator style={styles.loading} size="large" color="#3880ff" /> : null}
                                    {chequeData.image != '' ? <Image style={styles.chequeImage} source={{ uri: chequeData.image }}></Image> : null}
                                </View>
                            }
                        </View>
                    </ScrollView>

                }
                {paymentData.length ? <FlatList
                    //   refreshControl={
                    //     <RefreshControl
                    //     refreshing={showBusy}
                    //     onRefresh={getData}
                    //    />
                    //    }
                    data={paymentData}
                    renderItem={renderItems}
                    keyExtractor={(item, index) => index.toString()}
                    nesscrollEnabled={true}
                    nestedScrollEnabled={true}
                    style={{ marginBottom: 30 }}
                // onEndReached={loadMore}
                />
                    : null}


            </Card>
            </ScrollView>
            <View style={{ flexDirection: 'row', marginVertical: 10 }}>
                {amount > 0 && showPayLater && <TouchableOpacity style={[styles.button]}><Text style={styles.buttonText}>PAY LATER</Text></TouchableOpacity>}
                {selectedPaymentMethod == 'UPI' && amount > 0 && !verify ? <TouchableOpacity onPress={() => addPayment()} style={[styles.button, { backgroundColor: '#062b3d' }]}><Text style={styles.buttonText}>VERIFY</Text></TouchableOpacity> :
                    selectedPaymentMethod == 'UPI' && verify ? <ActivityIndicator style={{ textAlign: 'center', marginHorizontal: '40%' }} size="large" color="black" /> : null}
                {selectedPaymentMethod != 'UPI' && amount > 0 && <TouchableOpacity onPress={() => addPayment()} style={[styles.button, { backgroundColor: '#062b3d' }]}><Text style={styles.buttonText}>ADD</Text></TouchableOpacity>}
                {amount <= 0 && !saveLoader && <TouchableOpacity onPress={() => saveData()} style={[styles.button, { backgroundColor: '#062b3d' }]}><Text style={styles.buttonText}>SAVE</Text></TouchableOpacity>}
            </View>
            {showDatePicker ? <DateTimePicker
                testID="dateTimePicker"
                value={new Date(moment(date, 'DD/MM/YYYY').valueOf())}
                mode='date'
                is24Hour={true}
                display="calendar"
                is24Hour={true}
                minimumDate={new Date()}
                onChange={onCalendarChange}
            /> : null}
        </View>
    )
}

export default Payments;

const styles = StyleSheet.create({
    payment: {
        color: 'red',
        fontWeight: 'bold',
        fontSize: 15,
        paddingHorizontal: 20,
        paddingVertical: 20,
        textAlign: 'center'
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
    label: {
        fontSize:12
    },
    card: {
        borderRadius: 10,
        elevation: 10,
    },
    barcode: {
        fontSize: 35,
        color: '#062b3d',
        padding: 0,
        elevation: 0,
        marginTop: -10,
        left: '0%',
        flex: 0

    },
    item: {
        padding: 7,
        elevation: 5,
        flexDirection: 'row'
    },
    date: {
        fontSize: 16,
        color: '#062b3d',
        marginLeft: 15
    },
    calendar: {
        fontSize: 18,
    },
    takePicture: {
        paddingHorizontal: 10,
        marginHorizontal: 30,
        borderRadius: 5,
        marginVertical:10,
        paddingVertical: 3,
        height:27
    },
    chequeImage: {
        height: 300,
        width: 200,
        marginLeft: "15%",
        marginTop: "10%"
    },
    qrImage: {
        height: 300,
        width: '100%'
    },
    loader: {
        marginTop: '30%'
    }
})
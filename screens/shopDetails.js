import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { View, StyleSheet, Text, Alert, ToastAndroid,Modal, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Card, Input } from 'react-native-elements';
import { ScrollView } from 'react-native-gesture-handler';
import { CheckBox } from 'react-native-elements';
import doc from '../services/doc';
import { FlatList } from 'react-native';
import { Picker } from '@react-native-community/picker';
import { TouchableOpacity } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { updateShops, getShopDetails } from '../services/shipment';
import { PermissionsAndroid } from 'react-native';
import UploadPhoto from '../services/uploadPhoto';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
const ShopDetail = ({ navigation }) => {
    let [shopDetails, setShopDetails] = useState(navigation.getParam('data', {}));
    let [showBusy, setShowBusy] = useState(false);
    let[frontLoader,setFrontLoader] = useState(false);
    let[backLoader,setBackLoader] = useState(false);
    let [docFrontImage, setDocFrontImage] = useState(null);
    let [docBackImage, setDocBackImage] = useState(null);
    const [user,setUser] = useState(auth().currentUser);
    if (!shopDetails.documents) {
        shopDetails.documents = {}
    }
    if (shopDetails.documents && shopDetails.documents['GST']) {
        delete shopDetails.documents['GST'];
    }
    let [documents, setDocuments] = useState(null);
    let [selectedDocument, setSelectedDocument] = useState(null);
    let [inputNumber, setInputNumber] = useState('');
    let [uploading,setUploading] = useState(false);
    const handleChange = (data) => {
        setInputNumber(data);
    }
    const renderItems = item => {
        return (shopDetails.documents[item].url ? <View style={styles.docItem} key={item}>
            <View>
                <Text style={styles.item}>{item}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
                {shopDetails.documents[item].url ? <Image style={styles.thumbnail} source={{ uri: shopDetails.documents[item].url }} /> : null}
                {shopDetails.documents[item].backUrl ? <Image style={styles.thumbnail} source={{ uri: shopDetails.documents[item].backUrl }} /> : null}
            </View>
        </View>
            : null

        )
    }
    useEffect(() => {
        loadDocuments();
        const unsubscribe = navigation.addListener('willFocus', () => {
            loadDocuments();
        });  
        return unsubscribe;
      }, [navigation]);


    const loadDocuments  = async() => {
        documents = doc;
        let shopData = await getShopDetails(shopDetails.shopId);
        console.log(shopData.documents,'hhhh')
        for(let key in documents) {
            if(shopData.documents) {
            if(shopData.documents.hasOwnProperty(key)) {
                delete documents[key];
                console.log(documents);
            }
        }
        }
        console.log(documents);
        setDocuments(documents);
        setSelectedDocument(Object.keys(documents)[0])
    }
    const takePicture = async (type) => {
        let options = {
            mediaType: 'photo',
            cameraType: 'back',
            quality: 0.2,

        };
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("Camera permission given");
                launchCamera(options, async (response) => {
                    if (response.uri) {
                        Alert.alert(
                            "25taka",
                            "DO you want to save Image",
                            [
                                {
                                    text: "Cancel",
                                    onPress: () => console.log("Cancel Pressed"),
                                    style: "cancel"
                                },
                                {
                                    text: "OK", onPress: async () => {
                                        if (type == 'shop') {
                                            setShowBusy(true);
                                            let data = await UploadPhoto(response, null);
                                            let obj = {}
                                            obj['shopImage'] = {
                                                "status": 'ACCEPTED',
                                                "url": data
                                            }
                                            await updateShops(shopDetails.shopId, obj);
                                            let shopData = await getShopDetails(shopDetails.shopId);
                                            shopData.docs.forEach(element => {
                                                setShopDetails(element.data());
                                                setShowBusy(false)
                                            });
                                        }
                                        if (type == 'url') {
                                            setFrontLoader(true);
                                            let data = await UploadPhoto(response, null);
                                            setDocFrontImage(data)
                                            setFrontLoader(false);
                                        }
                                        if (type == 'backUrl') {
                                            setBackLoader(true);
                                            let data = await UploadPhoto(response, null);
                                            setDocBackImage(data);
                                            setBackLoader(false);
                                        }

                                    }
                                }]);
                    }

                });
            } else {
                console.log("Camera permission denied");
            }
        } catch (err) {
            console.warn(err);
        }

    };
    const saveDocuments = async() => {
        if(docFrontImage && docBackImage && inputNumber != '') {
        setUploading(true);
        let obj = {};
        obj['documents'] = {};
        obj['documents'][selectedDocument] = {
                'status': 'PENDING',
                'number' : inputNumber,
                'url' : docFrontImage,
                'backUrl' : docBackImage,
        }
        obj['docUploadedBy'] = user.uid;
        obj['docUploadedAt'] = firestore.Timestamp.now();
        await updateShops(shopDetails.shopId, obj);
        let shopData = await getShopDetails(shopDetails.shopId);
        shopData.docs.forEach(element => {
            setShopDetails(element.data());
            setDocFrontImage(null);
            setDocBackImage(null);
            ToastAndroid.showWithGravity(
                'Document uploaded Successfully',
                ToastAndroid.LONG,
                ToastAndroid.CENTER
              );
            setInputNumber('');
            setUploading(false);
            loadDocuments()
        });
        
        }
         else {
             alert('ALl fields are mandetory');
             return
         }
    }
    return (
        <ScrollView>
            <View>
                <View>
                    {shopDetails.shopImage && shopDetails.shopImage.url && !showBusy ? <Image style={styles.shopImage} source={{ uri: shopDetails.shopImage.url }}></Image> : null}
                    {!shopDetails.shopImage && !showBusy ? <Image style={styles.shopImage} source={require('../assets/product-placeholder.gif')}></Image> : null}
                    {showBusy ? <ActivityIndicator style={styles.loading} size="large" color="#062b3d" /> : null}
                    <Icon style={styles.camera} onPress={() => takePicture('shop')} name="camera"></Icon>
                </View>
                <View style={styles.detail}>
                    <Text style={{ fontSize: 18, color: 'red' }}>{shopDetails.name}</Text>
                    <Text style={{ fontSize: 15, color: 'grey', marginVertical: 5 }}>{shopDetails.address.line1},{shopDetails.address.landmark},{shopDetails.address.city},{shopDetails.address.state},{shopDetails.address.pincode}</Text>
                </View>
                {documents != null && Object.keys(documents).length ? <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.docText}>Upload Document</Text>
                    {documents != null && <Picker
                        selectedValue={selectedDocument}
                        style={{ height: 50, width: 150, color: 'red' }}
                        onValueChange={(itemValue, itemIndex) => { setSelectedDocument(Object.keys(documents)[itemIndex]) }}
                    >
                        {Object.keys(documents).map((item, index) => {
                            if (Object.keys(shopDetails.documents).length == 0) {
                                if (documents[item].required) {
                                    return <Picker.Item label={item} value={item} />
                                }
                            }
                            if (shopDetails.documents && Object.keys(shopDetails.documents).length != 0) {
                                    return <Picker.Item label={item} value={item} />
                                }
                        })}
                    </Picker>
                    }
                </View>: null}
                {documents != null && Object.keys(documents).length ? <View style={styles.detail}>
                    <Input placeholder='Enter Number' name="number" value={inputNumber} onChangeText={(e) => handleChange(e)} leftIcon={<Icon name='vcard' size={18} color='#062b3d' />} />
                    <View style={{ flexDirection: 'row' }}>
                        {!docFrontImage ? <TouchableOpacity onPress={() => { takePicture('url') }} style={styles.placeholder}>
                            {frontLoader ?<ActivityIndicator size="large" color="#062b3d" /> : <Icon name='plus' size={18} color='#062b3d' />}
                        </TouchableOpacity>
                            : <Image style={styles.docImage} source={{ uri: docFrontImage }} />
                        }
                        {!docBackImage ? <TouchableOpacity onPress={() => { takePicture('backUrl') }} style={styles.placeholder}>
                        {backLoader ?<ActivityIndicator size="large" color="#062b3d" /> : <Icon name='plus' size={18} color='#062b3d' />}
                        </TouchableOpacity>
                            : <Image style={styles.docImage} source={{ uri: docBackImage }} />
                        }
                    </View>
                    <TouchableOpacity onPress={() => saveDocuments()}>
                        {uploading ?<ActivityIndicator size="large" color="#062b3d" /> : <Text style={styles.button}>SAVE</Text>}
                    </TouchableOpacity>
                </View>: null}
                <View>
                    {Object.keys(shopDetails.documents).map((item, index) => {
                        return renderItems(item);
                    })}
                </View>
            </View>
        </ScrollView>
    )
}
const styles = StyleSheet.create({
    shopImage: {
        height: 350,
        width: '90%',
        borderRadius: 10,
        marginHorizontal: '5%',
        marginVertical: '4%'
    },
    loading: {
        height: 350,
        width: '90%',
        borderRadius: 10,
        marginHorizontal: '5%',
        marginVertical: '4%'
    },
    camera: {
        position: 'absolute',
        top: '80%',
        left: '80%',
        fontSize: 24,
        color: '#062b3d',
        elevation: 7,
        backgroundColor: 'white',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 10,
        elevation: 40
    },
    detail: {
        marginHorizontal: '8%',
        marginTop: '0%',
    },
    thumbnail: {
        height: 100,
        width: 100,
        flex: 1,
        marginHorizontal: 30
    },
    docItem: {
        marginHorizontal: '8%',
    },
    item: {
        color: '#062b3d',
        fontSize: 15,
        fontWeight: 'bold',
        paddingVertical: '3%'
    },
    docText: {
        flex: 1,
        color: '#062b3d',
        fontSize: 15,
        fontWeight: 'bold',
        paddingVertical: '3%',
        marginHorizontal: '8%'
    },
    placeholder: {
        flex: 1,
        marginHorizontal: 10,
        backgroundColor: 'lightgrey',
        paddingHorizontal: 55,
        paddingVertical: 50,
        borderRadius: 10,
        elevation: 5,
    },
    button: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        backgroundColor: '#062b3d',
        color: 'white',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        marginVertical: 20
    },
    docImage: {
        flex: 0,
        marginHorizontal: 10,
        height: 130,
        width: 130
    },
    Modal: {
        margin:0,
        height:100,
        backgroundColor:'red'
    },

})

export default ShopDetail;
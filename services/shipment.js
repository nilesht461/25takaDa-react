import firestore from '@react-native-firebase/firestore';
import axios from 'axios';
let rootDB = firestore().collection('debug').doc('demo');
export async function getShipments(uid, type,startTime,endTime) {
    console.log(startTime,endTime)
    return rootDB.collection('shipments').where('driverId', '==', uid).where("type","==","DA").where('status', '==', type).where('timestamp','>=',startTime).where('timestamp','<=',endTime).orderBy('timestamp', 'desc').get();
}
export async function getTotalShipmentsByDate(uid,startTime,endTime) {
    return rootDB.collection('shipments').where('driverId', '==', uid).where("type","==","DA").where('timestamp','>=',startTime).where('timestamp','<=',endTime).get();
}
export async function getFinishedShipmentsByDate(uid,startTime,endTime) {
    return rootDB.collection('shipments').where('driverId', '==', uid).where("type","==","DA").where('status', '==', 'FINISHED').where('timestamp','>=',startTime).where('timestamp','<=',endTime).get();
}
export async function getActiveShipmentsByDate(uid,startTime,endTime) {
    return rootDB.collection('shipments').where('driverId', '==', uid).where("type","==","DA").where('status', '==', 'ASSIGNED').where('timestamp','>=',startTime).where('timestamp','<=',endTime).get();
}
export async function getOrderDetails(id) {
    return rootDB
        .collection('orders').doc(id).get()
}
export async function getTotalPaymentByDate(uid,startTime,endTime) {
    console.log(uid,startTime,endTime)
    return rootDB.collection('payments').where('addedBy', '==', uid).where('timestamp','>=',startTime).where('timestamp','<=',endTime).get();
}

export async function getOrderItems(id) {
    let cTable = `orders/${id}/orderItems`
    return rootDB
        .collection(cTable).get()
}
export async function getShopDetails(id) {
    return rootDB
        .collection('shops').doc(id).get()
}
export async function getDAappUtils() {
    return firestore().collection('utils').doc('da_app').get()
}
export async function updateShops(sid, data) {
    return rootDB
        .collection('shops').doc(sid)
        .set(data, { merge: true })
}

export async function addTransactions(data) {
    let db = rootDB.collection('transactions');
    const id = db.doc().id;
    data['timestamp'] = firestore.Timestamp.now()
    data['txnId'] = id;
    db.doc(id).set(data, { merge: true })
    return id;
}
export async function updateSignature(data) {
    console.log(data);
    let url = "https://us-central1-pachistaka.cloudfunctions.net/getCfSignature"
    const options = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    return axios.post(url, data, options).then(res => { return res.data });
}
export async function updateQRCode(data) {
    // ${environment.apiHost}/
    let url = `https://us-central1-pachistaka.cloudfunctions.net/createCfOrder`
    const options = {
        headers: {
            'Content-Type': 'application/json'
        },
    };

    const pData = {
        prod: false,
        data: data
    }

    return axios.post(url, pData, options).then(res => { return res.data });

}
export async function getUpiPaymentStatus(txnId) {
    let url = `https://us-central1-pachistaka.cloudfunctions.net/getUpiPaymentStatus`

    var data = {
        "orderId": txnId
    }
    return axios.post(url, data).then(res => { return res.data });
}
export async function updateDelivery(paymentInfo,orderInfo,shipmentData,order) {
    let wBatch = firestore().batch();
    const roDB = rootDB
    // this.firestore.collection('debug').doc('test')

    paymentInfo.forEach(p => {
        let pid = firestore().createId;
        p['paymentId'] = pid
        const bRef = roDB
            .collection('payments')
            .doc(pid)

        wBatch.set(bRef, p, { merge: true })
    });

    if (shipmentData && order.hasOwnProperty('shipmentId')) {
        let shRef = roDB.collection('shipments').doc(order.shipmentId)
        wBatch.set(shRef, shipmentData, { merge: true })
    }
    if(Object.keys(orderInfo).length) {
    let cbRef = roDB.collection('orders').doc(order.orderId)
    wBatch.set(cbRef, orderInfo, { merge: true })
    }
    let refB = wBatch.commit()
    return await Promise.all([refB]).then((res) => {
        return res
    })
}
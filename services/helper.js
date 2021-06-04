import auth from '@react-native-firebase/auth';
import globalDate from '../services/date';
import {getFinishedShipmentsByDate,getOrderDetails,getShopDetails,getShipments,getActiveShipmentsByDate} from '../services/shipment';
let user = auth().currentUser;

export  async function updateCount() {
    globalDate.tripDate.startTime.setHours(0,0,0,0);
    globalDate.tripDate.endTime.setHours(23,59,59,59);
    let cancelledTrips = await getShipments(user.uid,'CANCELED',globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    let activeTrips =  await getActiveShipmentsByDate(user.uid,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    let finishedTrips = await getFinishedShipmentsByDate(user.uid,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    let count = {
        cancelledTrips : cancelledTrips.docs.length,
        activeTrips: activeTrips.docs.length,
        finishedTrips: finishedTrips.docs.length
    }
    return count;
}

export  async function updateTrips(type) {
    let shipments = await getShipments(user.uid,type,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    let allTrips = [];
    for(let i = 0; i < shipments.docs.length;i++) {
        let trip = shipments.docs[i].data();
        let order  = await getOrderDetails(shipments.docs[i].data().orderId);  
        let shop =  await getShopDetails(shipments.docs[i].data().shopId);
        // console.log(shop.data())
        trip['order'] = order.data();
        trip['shop'] = shop.data();
        allTrips.push(trip);
    }
    return allTrips
}

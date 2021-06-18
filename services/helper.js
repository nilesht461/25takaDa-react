import auth from '@react-native-firebase/auth';
import globalDate from '../services/date';
import {getFinishedShipmentsByDate,getOrderDetails,getShopDetails,getShipments,getActiveShipmentsByDate} from '../services/shipment';
let user = auth().currentUser;

export  async function updateCount(tripId) {
    console.log(tripId)
    globalDate.tripDate.startTime.setHours(0,0,0,0);
    globalDate.tripDate.endTime.setHours(23,59,59,59);
    let cancelledTrips = await getShipments(user.uid,'CANCELED',tripId,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    let activeTrips =  await getActiveShipmentsByDate(user.uid,tripId,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    let finishedTrips = await getFinishedShipmentsByDate(user.uid,tripId,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    let count = {
        cancelledTrips : cancelledTrips.docs.length,
        activeTrips: activeTrips.docs.length,
        finishedTrips: finishedTrips.docs.length
    }
    return count;
}

export  async function updateTrips(type,tripId) {
    console.log(tripId)
    let shipments = await getShipments(user.uid,type,tripId,globalDate.tripDate.startTime,globalDate.tripDate.endTime);
    let allTrips = [];
    for(let i = 0; i < shipments.docs.length;i++) {
        let trip = shipments.docs[i].data();
        allTrips.push(trip);
    }
    return allTrips
}
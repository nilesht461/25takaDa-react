import getRootDB from '../environment';
// import * as firebase from 'firebase';
// import '@firebase/firestore';
// import 'firebase/firestore';
import firestore from '@react-native-firebase/firestore';
let rootDB = firestore();

export async function getUserById(uid) {
    console.log(uid);
    return firestore().collection('users').where('userId', '==', uid).limit(1).get()
}

export async function addUser(obj) {
    console.log("it ran");
    let db = firestore()
    .collection('users')
    // const id = db.doc().id;
    // console.log(id);
    return await db.doc(obj.userId)
        .set(obj, { merge: true })
        .then(function () {
            return obj;
        })
}
export async function getUserByNumber(phoneNumber) {
    return firestore().collection('users').where('phoneNumber', '==', phoneNumber).limit(1).get()
}
import storage from '@react-native-firebase/storage'
const uploadPhoto =async(response,shopName) => {
    let path = `$LeadGeneration/${Date.now()}`;
    console.log("123",response);
    await storage().ref(path).putFile(response.uri);
    const url = await storage().ref(path).getDownloadURL();
    console.log(url);
    return url;
}
// const dataURItoBlob =  (dataURI) =>{
//     const byteString = window.atob(dataURI);
//    const arrayBuffer = new ArrayBuffer(byteString.length);
//     const int8Array = new Uint8Array(arrayBuffer);
//     for (let i = 0; i < byteString.length; i++) {
//       int8Array[i] = byteString.charCodeAt(i);
//      }
//     const blob = new Blob([int8Array], { type: 'image/jpeg' });    
//    return blob;
//   }

export default uploadPhoto;
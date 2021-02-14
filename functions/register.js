const firebase = require('firebase')
const qs = require('querystring');

const firebaseConfig = {
  apiKey: "AIzaSyCNGralWpRTUNJgPJdJLOYcZ4xXj-gxBC8",
  authDomain: "long-victor-304116.firebaseapp.com",
  databaseURL: "https://long-victor-304116-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "long-victor-304116",
  storageBucket: "long-victor-304116.appspot.com",
  messagingSenderId: "668790316116",
  appId: "1:668790316116:web:f5a416eb1b98cf4f4de1c1"
};

exports.handler = async (event) => {


  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  } else {
    firebase.app();
  }

  console.log(event.body)
  try {
    const body = qs.parse(event.body.toString());
    const {name, email, service, gmap} = body
    return firebase.database().ref('registrations').push().set({name, email, service, gmap})
      .then((result) => {
        return {
          statusCode: 200,
          body: JSON.stringify({success: 'True'})
        }})
      .catch((err) => {
        return {
          statusCode: 500,
          body: JSON.stringify({success: 'False', errorMessage: err})
        }})
  } catch (err) {
    console.log(err)
    return {
      statusCode: 500,
      body: JSON.stringify({success: 'False'})
    }
  }
}
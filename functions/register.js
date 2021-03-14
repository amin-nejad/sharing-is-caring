const firebase = require('firebase')
const qs = require('querystring');
var nodemailer = require('nodemailer');
const smtpURL = process.env.SMTP_URL;
let transporter = nodemailer.createTransport(smtpURL)

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
    const {name, email, businessName, service, gmapWebsite, gmapLat, gmapLong, gmapURL, gmapPlaceID} = body
    const datetime =  new Date().toLocaleString('en-GB', { timeZone: 'UTC' })
    return firebase.database().ref('registrations').push().set({datetime, name, email, businessName, service, gmapWebsite, gmapLat, gmapLong, gmapURL, gmapPlaceID, verified: "N"})
      .then((result) => {
        var mailOptions = {
          from: 'Andreas Kattou <noreply@sharingiscaring.charity>',
          to: email,
          bcc: 'aanejad@hotmail.co.uk',
          subject: 'Sharing is Caring Registration Confirmation',
          html: `<p>Hi ${name},</p> 
          <p>Thank you for signing up <a href="${gmapURL}">${businessName}</a> to Sharing is Caring, Serve our Nation!</p>
          <p>Best of luck and don't forget to follow our instructions on displaying the logo and promoting your scheme.</p>
          <p>Kind regards,<br>Andreas</p>
          <p>NB. This mailbox is not monitored. If you need to get in touch, contact us on <a href="mailto:hello@sharingiscaring.charity">hello@sharingiscaring.charity</a></p>`,
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
            return error
          } else {
            console.log('Email sent: ' + info.response);
            return info.response
          }
        });  
      })
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
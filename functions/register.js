const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://long-victor-304116-default-rtdb.europe-west1.firebasedatabase.app"
})

const db = admin.firestore()

exports.handler = async (event, context, callback) => {
  await db.collection('COLLECTION').add({
    name: 'Test'
  })

  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      data: `Test data added successfully`
    })
  })
}
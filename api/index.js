const express = require('express')
const cors = require("cors")

var admin = require("firebase-admin")

var serviceAccount = require("./auth.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const app = express()


app.use(cors())
app.use(express.json())


app.get("/", (req, res)=> {

    res.json({ running: true, })
})


app.get("/v", async (req, res)=> {


    try {
        const idToken = req.query.token
        const result = await admin.auth().verifyIdToken(idToken)    


        res.json({ running: true, result, })
    } catch(e) {
        console.log("error : ", e)

        res.status(400).json({ error: 'bad details' })
    }
})

app.post("/authenticate", async (req, res)=> {

    try {
        const { token } = req.body

        console.log('====================================');
        console.log(" token ", token);
        console.log('====================================');
        
        const result = await admin.auth().verifyIdToken(token)

        res.json({ running: true, result, })
    } catch(e) {
        console.log("error : ", e)

        res.status(400).json({ error: 'bad details' })
    }
})


app.listen(4444, ()=> {
    console.log("auth server running")
})


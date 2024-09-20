import dotenv from 'dotenv'
import dbConnection from './db/index.js'
import {app} from './app.js'
dotenv.config({
    path:'./.env'
})
const port =process.env.PORT || 8000
dbConnection()
.then(()=>{
    app.on("Error",(error)=>{
        console.log("App Running Error !",error)
    })
    app.listen(port,()=>{
        console.log("App listening on port ",port)
    })
})
.catch((error)=>{
    console.log('Database Connect Failed', error)
})

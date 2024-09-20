import dotenv from 'dotenv'
import dbConnection from './db/index.js'
dotenv.config({
    path:'./.env'
})

dbConnection()
.then(()=>{
    console.log('Database Connected Successfully !')
})
.catch((error)=>{
    console.log('Database Connect Failed', error)
})

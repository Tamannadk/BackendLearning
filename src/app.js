import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
const app = express();

app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded(
    {
        extended:true,
        limit:"16kb"
    }
))
app.use(express.static("public"))
app.use(cookieParser())

//⁡⁢⁢⁣𝙧𝙤𝙪𝙩𝙚𝙨 𝙞𝙢𝙥𝙤𝙧𝙩⁡

import userRouter from './routes/user.routes.js'

// ⁡⁣⁢⁣𝙧𝙤𝙪𝙩𝙚𝙨 𝙙𝙚𝙘𝙡𝙖𝙧𝙖𝙩𝙞𝙤𝙣⁡
app.use("/api/v1/users",userRouter)


export { app };

require('dotenv')
const express=require('express')
const app=express();
app.get('/',(req,res)=>{
    res.send('Hello World!')
})

app.get('/twitter',(req,res)=>{
    res.send('tamannadotcom')
})

app.get('/login',(request,response)=>{
    response.send('<h1>Please login at chai aur code</h1>')
})

app.get('/youtube',(request,response)=>{
    response.send('<h1>Chai aur code</h1>')
})

app.listen(process.env.PORT,()=>{
    console.log(`Server is listening to the port ${process.env.PORT}`)
})
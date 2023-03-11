const express = require('express')  // npm install express (-g全局安裝不行，不知為何)
const app = express()
const main = require('./main')
// var bodyParser = require('body-parser')
// app.use(bodyParser())


// 解決方案：https://stackoverflow.com/questions/19917401/error-request-entity-too-large
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb'}));

app.post("/decode",function(req,res){
    let result = req.body
    console.log("result",result)
    let a = result.a
    result = main.dweklxde(a)
    res.send(result.toString())
})

app.post("/getParam",function(req,res){
    let result = req.body
    console.log("result",result)
    result = main.getParam(result.p1,result.p2,result.k,result.key,result.iv,result.mode)
    res.send(result.toString())
})
app.post("/dataDecode",function(req,res){
    let result = req.body
    console.log("result",result)
    result = main.dataDecode(result.data,result.aes_key,result.aes_iv,result.des_key,result.des_iv)
    res.send(result.toString())
})

app.listen(3000,()=>{
    console.log("開始服務，端口3000")
})
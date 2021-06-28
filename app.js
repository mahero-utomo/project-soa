const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(`${__dirname}/assets`));
const model = require('./models');
const axios = require('axios').default;
const fs = require('fs');
const morgan = require('morgan');
const request = require('request');
// const session = require('express-session');
app.use(express.urlencoded({extended : false}));
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const port = process.env.PORT || 8080;
require('dotenv').config();
// console.log(process.env.secret);

app.use(morgan((tokens, req, res)=>{
    return [`Method:${tokens.method(req, res)+";"} URL:${tokens.url(req, res)}; Status:${tokens.status(req, res)}; Message: ${res.statusMessage}; DateTime: ${(new Date().getDate() < 10 ? "0" : "") + new Date().getDate() + '/' + ((new Date().getMonth() + 1 < 10 ? "0" : "") + (new Date().getMonth() + 1)) + '/' + new Date().getFullYear()}; ResponseTime: ${Math.floor(tokens['response-time'](req, res))+" ms"}`].join(' ')
},{stream:fs.createWriteStream('./logger.log', {flags:'a'},)}));

app.get("/", async(req, res) => {
    res.render("index", {
        message:"",
        errorMessage:"",
        resultArr:[]
    });
});

app.get("/login", async(req, res) => {
    res.render("login");
});

app.get("/register", async(req, res) => {
    res.render("register");
});

app.post("/developer/register", async(req, res) => {
    let input = req.body, errorResult = {}
    if (input.email.length < 1) {
        errorResult.email = `field email tidak boleh kosong`
    } else if (await model.checkBy("developer", "email", input.email) > 0) {
        errorResult.email = `email ${input.email} telah terdaftar pada sistem`
    } else if (!await model.validateEmail(input.email)) {
        errorResult.email = `email ${input.email} tidak valid`
    }
    if (input.username.length < 1) {
        errorResult.username = `field username tidak boleh kosong`
    } else if (await model.checkBy("developer", "username", input.username) > 0) {
        errorResult.username = `username ${input.username} telah terdaftar pada sistem`
    } else if (!await model.validateUsername(input.username)) {
        errorResult.username = `username ${input.username} tidak valid`
    }
    if (input.name.length < 1) {
        errorResult.name = `field name tidak boleh kosong`
    }
    if (input.password.length < 1) {
        errorResult.password = `field password tidak boleh kosong`
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.render('register', {
            errorResult: errorResult,
        })
    } else {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(input.password, saltRounds)
        try {
            if (await model.registerDeveloper(input.email, input.username, input.name, hashedPassword)) {
                res.render('login', {
                    message:`${input.username} berhasil register`,
                })
            }
        } catch (error) {
            console.log(error)
        }
    }
});

app.post('/developer/login', async(req, res) => {
    let input = req.body, errorResult = {}
    if (input.email.length < 1 || input.password.length < 1) {
        if (input.email.length < 1) errorResult.email = `field email tidak boleh kosong`
        if (input.password.length < 1) errorResult.password = `field password tidak boleh kosong`
    } else {
        if (await model.checkBy("developer", "email", input.email) <= 0) 
            errorResult.email = `email developer tidak terdaftar`
        else {
            let devPassword = await model.getPassword("developer", "email", input.email)
            if (!bcrypt.compareSync(input.password, devPassword)) 
                errorResult.password = `password developer tidak sesuai`
        }
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.render('login', {
            errorResult: errorResult,
        })
    } else {
        // console.log('login sukses')
        let token = jsonwebtoken.sign({
            email: input.email,
        }, process.env.secret, {expiresIn: "10m"})
        res.render('index', {
            errorResult: errorResult,
        })
    }
});

app.post('/developer/login/changePassword', async(req, res) =>{
    //belum tak cek soale gtw respond kemana tapi haruse bisa aq dah buatin model buat change password jga
    const token = req.header("x-auth-token");
    let user = {}
    let input = req.body, errorResult = {}
    if(!token){
        errorResult.token = `token belum ada`
    }
    try{
        user = jsonwebtoken.verify(token,process.env.secret);
    }catch(err){
        errorResult.token = `token invalid`
    }
    if (input.password.length < 1) {
        errorResult.password = `field password tidak boleh kosong`
    } else if (input.confirmPass.length < 1) {
        errorResult.confirmPass = `field confirmation tidak boleh kosong`
    } else if (input.password == input.confirmPass) {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(input.password, saltRounds)
        if (await model.changePassDev(user.email, hashedPassword)) {
            //aku gak tahu mau respond kemana ini tinggal respond render
        }
    }else{
        errorResult.confirmPass = `password dan confirmation password tidak sama`
    }
    
})

// baru

app.post('/user/resgiter', async(req,res)=>{

})
app.listen(port, () => {
    console.log(`Running to port ${port}`);
});
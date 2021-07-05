const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(`${__dirname}/assets`));
const model = require('./models');
const axios = require('axios').default;
const fs = require('fs');
const morgan = require('morgan');
const multer = require('multer');
const dbase = require("./connection");
const request = require('request');
app.use(express.urlencoded({extended : false}));
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
// const createError = require('http-errors');
// app.use(async (req, res, next) => {
//     next(createError.NotFound())
// });
// const PORT = process.env.PORT || 8080;
require('dotenv').config();
// const logged_in_user = {};

app.use(morgan((tokens, req, res) => {
    return [`Method:${tokens.method(req, res)}; URL:${tokens.url(req, res)}; Status:${tokens.status(req, res)}; Message: ${res.statusMessage}; DateTime: ${(new Date().getDate() < 10 ? "0" : "") + new Date().getDate() + '/' + ((new Date().getMonth() + 1 < 10 ? "0" : "") + (new Date().getMonth() + 1)) + '/' + new Date().getFullYear()}; ResponseTime: ${Math.floor(tokens['response-time'](req, res))} ms`].join(' ')
},{stream:fs.createWriteStream('./logger.log', {flags:'a'},)}));

const dir = './images', storage = multer.diskStorage({
    destination:function(req,file,callback){
        callback(null, dir);
    },
    filename:async function(req,file,callback){
        const extension = file.originalname.split('.')[file.originalname.split('.').length-1];
        // let dataTugas = await model.findTaskBy(req.body.kode_tugas), username = await model.findUsername(req.body.username)
        // const filename = dataTugas.kode_tugas + "_" + username;
        const filename = req.developer.username;
        isFileExist(filename)
        callback(null,(filename+'.'+extension));
    }
});

function checkFileType(file,cb) {
    // const filetypes= /zip|rar/;
    const filetypes= /jpeg|jpg|png|gif/;
    const extname=filetypes.test(file.originalname.split('.')[file.originalname.split('.').length-1]);
    const mimetype=filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null,true);
    } else {
        cb(error = 'Error : Image Format Type Only');
    }
}

function isFileExist(filename) {
    let arr_files = []
    fs.readdirSync(`${__dirname}\\images`).forEach(file => {
        arr_files.push(file)
    })
    arr_files.forEach(file => {
        if (filename == file.split(".")[0]) {
            fs.unlinkSync(`${__dirname}\\images\\${file}`)
        }
    })
}

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

app.get("/", async(req, res) => {
    res.render("index", {
        message:"",
        errorMessage:"",
        resultArr:[]
    });
});

// app.get("/login", async(req, res) => {
//     res.render("login");
// });

// app.get("/register", async(req, res) => {
//     res.render("register");
// });

app.post("/developer/register", async(req, res) => {
    let input = req.body, errorResult = {}
    if (input.email.length < 1) {
        errorResult.email = `field email tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "email", input.email) > 0) {
        errorResult.email = `email ${input.email} telah terdaftar pada sistem`
    } else if (!await model.validateEmail(input.email)) {
        errorResult.email = `email ${input.email} tidak valid`
    }
    if (input.username.length < 1) {
        errorResult.username = `field username tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "username", input.username) > 0) {
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
        res.status(400).json({
            listError: errorResult,
        })
        // res.render('register', {
        //     errorResult: errorResult,
        // })
    } else {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(input.password, saltRounds)
        try {
            if (await model.registerDeveloper(input.email, input.username, input.name, hashedPassword)) {
                res.status(201).json({
                    message:`${input.username} berhasil register`,
                })
                // res.render('login', {
                //     message:`${input.username} berhasil register`,
                // })
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
        if (await model.checkBy("developer_account", "email", input.email) <= 0) 
            errorResult.email = `email developer tidak terdaftar`
        else {
            let devPassword = await model.getPassword("developer_account", "email", input.email)
            if (!bcrypt.compareSync(input.password, devPassword)) 
                errorResult.password = `password developer tidak sesuai`
        }
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
        // res.render('login', {
        //     errorResult: errorResult,
        // })
    } else {
        res.status(200).json({
            message: `${await model.getUsername("developer_account", "email", input.email)} berhasil register`,
            token: jsonwebtoken.sign({email: input.email,}, process.env.SECRET_KEY, {expiresIn: "10m"}),
        })
        // res.render('index', {
        //     errorResult: errorResult,
        // })
    }
});

function verifyAuthToken(req, res, next) {
    if (!req.headers["x-auth-token"]) {
        return res.status(401).json({error: "Token Authentication Not Found"});
    }
    let developer = {};
    try {
        developer = jsonwebtoken.verify(req.headers["x-auth-token"], process.env.SECRET_KEY);
    } catch (error) {
        return res.status(401).json({error: "Invalid Token Authentication"});
    }
    req.developer = developer;
    next();
}

app.get('/developer/', verifyAuthToken, async(req, res) => {
    let data = await model.findBy("developer_account", "email", req.developer.email);
    delete data[0].profile_photo;
    delete data[0].password;
    return res.status(200).json(data);
})

app.post('/developer/photo', verifyAuthToken, upload.single("photo"), async(req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "Profile Photo tidak boleh kosong",
        })
    }
    try {
        // if (await model.fileTaskExist(dataTugas.kode_tugas, req.file.filename.split(".")[0], username) > 0) {
        //     let id = await model.idTaskExist(dataTugas.kode_tugas, req.file.filename.split(".")[0], username)
        //     if (await model.deleteTaskExist(id) && await model.turnInTask(dataTugas.kode_tugas, req.file.filename, username)) {
        //         return res.status(200).json({
        //             message: "Berhasil mengumpulkan tugas",
        //         })
        //     }
        // } else {
        //     if (await model.turnInTask(dataTugas.kode_tugas, req.file.filename, username)) {
        //         return res.status(201).json({
        //             message: "Berhasil mengumpulkan tugas",
        //         })
        //     }
        // }
        if (await model.uploadPhoto(req.file.filename, req.developer.email)) {
            let username = await model.getUsername("developer_account", "email", req.developer.email);
            return res.status(200).json({
                message:`${username} Berhasil Upload Profile Photo`,
            })
        }
    } catch (error) {
        return res.status(500).json({error: "Upload Profile Photo Gagal"});
    }
})

app.put('/developer/', verifyAuthToken, async(req, res) => {
    let input = req.body
    if (input.username.length < 1) {
        errorResult.username = `field username tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "username", input.username) > 0) {
        errorResult.username = `username ${input.username} telah terdaftar pada sistem`
    } else if (!await model.validateUsername(input.username)) {
        errorResult.username = `username ${input.username} tidak valid`
    }
    if (input.name.length < 1) {
        errorResult.name = `field name tidak boleh kosong`
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        let old_data = await model.findBy("developer_account", "email", req.developer.email);
        try {
            if (await model.updateDeveloper(input.username, input.name, req.developer.email)) {
                return res.status(200).json({
                    old_username: old_data[0].username,
                    old_name: old_data[0].name,
                    new_username: input.username,
                    new_name: input.name,
                })
            }
        } catch (error) {
            return res.status(500).json({error: "Update Account Profile Gagal"});
        }
    }
})

app.put('/developer/changePassword', verifyAuthToken, async(req, res) => {
    //belum tak cek soale gtw respond kemana tapi haruse bisa aq dah buatin model buat change password jga
    // const token = req.header("x-auth-token");
    // let user = {}
    // let input = req.body, errorResult = {}
    // if(!token){
    //     errorResult.token = `token belum ada`
    // }
    // try{
    //     user = jsonwebtoken.verify(token,process.env.SECRET_KEY);
    // }catch(err){
    //     errorResult.token = `token invalid`
    // }

    // if (input.password.length < 1) {
    //     errorResult.password = `field password tidak boleh kosong`
    // } else if (input.confirmPass.length < 1) {
    //     errorResult.confirmPass = `field confirmation tidak boleh kosong`
    // } else if (input.password == input.confirmPass) {
    //     let saltRounds = 10, hashedPassword = bcrypt.hashSync(input.password, saltRounds)
    //     if (await model.changePassDev(user.email, hashedPassword)) {
    //         //aku gak tahu mau respond kemana ini tinggal respond render
    //         res.render('changePassword', {
    //             message:`${input.username} Ubah password berhasil`,
    //         })
    //     }
    // }else{
    //     errorResult.confirmPass = `password dan confirmation password tidak sama`
    // }

    if (req.body.new_password.length < 1) {
        res.status(400).json({
            error: `Field New Password tidak boleh kosong`
        })
    }
    try {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(req.body.new_password, saltRounds)
        if (await model.changePass('developer_account', hashedPassword, req.developer.email)) {
            let username = await model.getUsername("developer_account", "email", req.developer.email);
            res.status(200).json({
                message:`${username} Ganti Password Berhasil`,
            })
        }
    } catch (error) {
        return res.status(500).json({error: "Ganti Password Gagal"});
    }
})

app.post('/user/register', async(req,res)=>{
    let errorResult = {}, email = req.body.email, username = req.body.username, name = req.body.name, password = req.body.password,
        cpass = req.body.confirm_password, no_telp = req.body.no_telp,  role = req.body.role.toLowerCase();
    let saldo = 0, api_hit = 0;
    let temp = req.body.tanggal_lahir.split('/');
    let tanggal_lahir = temp[2]+"-"+temp[1]+"-"+temp[0];
    if (email.length < 1){
        errorResult.email = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }else if (!await model.validateEmail(email)){
        errorResult.email = 'Format Salah';
        return res.status(400).send(errorResult);
    }else if(!await model.cekDataEmail(email)){
        errorResult.email = 'Email Sudah Terdaftar';
        return res.status(400).send(errorResult);
    }
    if(username.length < 1){
        errorResult.username = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    else if(!await model.cekDataUsername(username)){
        errorResult.email = 'Username Sudah terdaftar';
        return res.status(400).send(errorResult);
    }
    if(name.length < 1){
        errorResult.name = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    if (password.length < 1){
        errorResult.password = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    if (cpass.length < 1){
        errorResult.confirm_password = 'Field tidak boleh kosong';
        return res.status(400).send(errorResult);
    }
    if (password != cpass){
        errorResult.password = 'Password dan Confirm Password tidak sama';
        return res.status(400).send(errorResult);
    }
    if (isNaN(no_telp)){
        errorResult.no_telp = 'Input wajib angka';
        return res.status(400).send(errorResult);
    }
    if (role == 'dokter' ||  role == 'client' || role == 'receptionist') {
        console.log(role)
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(password, saltRounds)
        try{
            await model.registerUser(email, username, name, hashedPassword, tanggal_lahir, no_telp, saldo, role, api_hit)
            let result = {
                "Email" : email,
                "Username" : username,
                "Name" : name,
                "Tanggal Lahit" : tanggal_lahir,
                "Nomor Telepon" : no_telp,
                "Saldo " : "Rp "+saldo,
                "Role" : role,
                "Api_hit" : api_hit
            }
            return res.status(201).send(result);
        }catch (ex) {
            console.log(ex);
        }
    }
    else{
        errorResult.role = 'Role tidak sesuai';
        return res.status(400).send(errorResult);
    }
    /*let input = req.body, errorResult = {}
    if (input.email.length < 1) {
        errorResult.email = `field email tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "email", input.email) > 0) {
        errorResult.email = `email ${input.email} telah terdaftar pada sistem`
    } else if (!await model.validateEmail(input.email)) {
        errorResult.email = `email ${input.email} tidak valid`
    }
    if (input.username.length < 1) {
        errorResult.username = `field username tidak boleh kosong`
    } else if (await model.checkBy("developer_account", "username", input.username) > 0) {
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
    if (input.tanggal_lahir.length < 1) {
        errorResult.name = `field tanggal lahir tidak boleh kosong`
    } else {
        
    }
    if (input.no_telp.length < 1) {
        errorResult.password = `field nomor telepon tidak boleh kosong`
    }
    if (input.saldo.length < 1) {
        errorResult.name = `field saldo tidak boleh kosong`
    }
    if (input.role.length < 1) {
        errorResult.password = `field role tidak boleh kosong`
    }
    if (!(Object.entries(errorResult).length === 0)) {
        res.status(400).json({
            listError: errorResult,
        })
    } else {
        let saltRounds = 10, hashedPassword = bcrypt.hashSync(input.password, saltRounds)
        try {
            if (await model.registerDeveloper(input.email, input.username, input.name, hashedPassword)) {
                res.status(201).json({
                    message:`${input.username} berhasil register`,
                })
                // res.render('login', {
                //     message:`${input.username} berhasil register`,
                // })
            }
        } catch (error) {
            console.log(error)
        }
    }*/
})

//client login
app.post('/user/login', async(req,res)=>{
    let result = {};
    let email = req.body.email;
    let password = req.body.password;
    if (email.length < 1){
        result = {
            "Message" : "Email wajib diisi"
        }
        return res.status(400).send(result)
    }else if(!await model.cekDataEmail(email)){
        result = {
            "Message" : "Email tidak terdaftar"
        }
        return res.status(400).send(result);
    }
    if (password.length < 1){
        result = {
            "Message" : "Password wajib diisi"
        }
        return res.status(400).send(result)
    }
    else{
        try {
            let bcryptPass = await model.getPassword("user_account", "email", email)
            let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
            let username = user[0].username;
            let name = user[0].name;
            let saldo = user[0].saldo;
            let api_hit = user[0].api_hit;
            let role = user[0].role;
            let secret = "";
            if (!bcrypt.compareSync(password, bcryptPass)){
                result = {
                    "Message" : "Password Salah"
                }
                return res.status(400).send(result);
            }else{
                let token = jsonwebtoken.sign({
                    "email" : email,
                    "name" : name,
                    "saldo" : saldo,
                    "api_hit" : api_hit,
                    "role" : "client"
                }, "user", {'expiresIn':'30m'});
                result = {
                    "Email" : email,
                    "Username" : username,
                    "Token" : token
                }
                return res.status(200).send(result);
            }
        }catch (e) {
            console.log(e);
        }
    }
})

function verifyUserAccessToken(req, res, next) {
    if (!req.headers["x-auth-token"]) {
        return res.status(401).json({error: "Token Authentication Not Found"});
    }
    let developer = {};
    try {
        developer = jsonwebtoken.verify(req.headers["x-auth-token"], process.env.SECRET_KEY);
    } catch (error) {
        return res.status(401).json({error: "Invalid Token Authentication"});
    }
    req.developer = developer;
    next();
}

//update data client
app.put('/client', async (req,res)=>{
    const token = req.header("x-auth-token");
    let result = {}, user = {};
    let username = req.body.username, name = req.body.name, no_telp = req.body.no_telp;
    if (!token){
        return res.status(401).send("Unauthorized");
    }
    try{
        user = jsonwebtoken.verify(token, "user");
    }catch (e) {
        return res.status(401).send("Unauthorized");
    }
    let email = user.email;
    let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
    if (username.length == 0){
        username = users[0].username;
    }
    if (name.length == 0){
        name = users[0].name;
    }
    if (no_telp.length == 0){
        no_telp = users[0].no_telp;
    }
    let data = await dbase.executeQuery(`update user_account set username = '${username}', name = '${name}', no_telp = '${no_telp}' where email = '${email}'`);
    result = {
        "username" : username,
        "name" : name,
        "no_telp" : no_telp
    }
    return res.status(200).send(result);

})

//change password client
app.put('/client/changePassword', async (req, res) =>{
    let result = {};
    let email = req.body.email;
    let password_baru = req.body.password_baru;
    let cpass = req.body.confirm_password;
    let password = req.body.password;
    if (email.length < 1){
        result = {
            "Message" : "Email Harus Diisi"
        }
        return res.status(401).send(result);
    }
    if (password.length < 1){
        result = {
            "Message" : "Password Harus Diisi"
        }
        return res.status(401).send(result);
    }
    if (password_baru.length < 1){
        result = {
            "Message" : "Password Baru Harus Diisi"
        }
        return res.status(401).send(result);
    }
    if (cpass.length < 1){
        result = {
            "Message" : "Confrim Password Harus Diisi"
        }
        return res.status(401).send(result);
    }
    if (!await model.cekDataEmail(email)){
        result = {
            "Message" : "Akun tidak terdadftar"
        }
        return res.status(401).send(result);
    }
    else{
        if (password_baru != cpass){
            result = {
                "Message" : "Password dan Confirm Password harus sama"
            }
            return res.status(401).send(result);
        }
        try {
            let bcryptPass = await model.getPassword("user_account", "email", email)
            if (!bcrypt.compareSync(password, bcryptPass)){
                result = {
                    "Message" : "Password Salah"
                }
                return res.status(400).send(result);
            }else{
                let saltRounds = 10, hashedPassword = bcrypt.hashSync(password_baru, saltRounds)
                let users = await dbase.executeQuery(`update user_account set password = '${hashedPassword}' where email = '${email}'`);
                result = {
                    "message" : "sukses"
                }
                return res.status(200).send(result);
            }
        }catch (e) {
            console.log(e);
        }
    }

    let cek = await dbase.executeQuery(`select * from user_account where email = ${email} and password = ${password}`);
    if (cek.length == 0){
        let result = {
            "Message" : "Password salah"
        }
        return res.status(401).send(result)
    }
    else {
        let bcryptPass = await model.getPassword("user_account", "email", email)
        let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
        let username = user[0].username;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let saltRounds = 10, hashedPassword = bcrypt.hashSync(password_baru, saltRounds)
            let client = await dbase.executeQuery(`update user_account set password=${hashedPassword} where email=${email}`);
            let result = {
                "Message" : "Change Password Success"
            }
            return res.status(200).send(result);
        }
    }
})

// get token baru user yg sedang login
app.post('/client/refresh', async (req, res)=>{
    let token = req.header("x-auth-token");
    let email = req.body.email;
    let password = req.body.password;
    if (email.length < 1){
        result = {
            "Message" : "Email wajib diisi"
        }
        return res.status(400).send(result)
    }else if(!await model.cekDataEmail(email)){
        result = {
            "Message" : "Email tidak terdaftar"
        }
        return res.status(400).send(result);
    }
    if (password.length < 1){
        result = {
            "Message" : "Password wajib diisi"
        }
        return res.status(400).send()
    }
    try{
        let bcryptPass = await model.getPassword("user_account", "email", email)
        let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
        let username = user[0].username;
        let saldo = user[0].saldo;
        let api_hit = user[0].api_hit;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let token = jsonwebtoken.sign({
                "email" : email,
                "username" : username,
                "saldo" : saldo,
                "api_hit" : api_hit,
                "role" : "client"
            }, "user", {'expiresIn':'30m'});
            result = {
                "Email" : email,
                "Username" : username,
                "Token Baru" : token
            }
            return res.status(200).send(result);
        }
    }catch (e) {
        console.log(e);
    }
})

//delete client account yg sedang login
app.delete('/client', async (req, res)=>{
    let email = req.body.email;
    let password = req.body.password;
    let result = {};
    try{
        let bcryptPass = await model.getPassword("user_account", "email", email)
        let user = await dbase.executeQuery(`select * from user_account where email = '${email}'`)
        let username = user[0].username;
        if (!bcrypt.compareSync(password, bcryptPass)){
            result = {
                "Message" : "Password Salah"
            }
            return res.status(400).send(result);
        }else{
            let users = await dbase.executeQuery(`delete from user_account where email = '${email}'`);
            result = {
                "Message" : "Delete Account Success"
            }
            return res.status(200).send(result);
        }
    }catch (e) {
        console.log(e);
    }
})

// cek data client yang sedang login
app.get(`/client`,async(req, res) =>{
    const token = req.header("x-auth-token");
    let user  = {};
    if(!token){
        return res.status(401).send("unauthorized");
    }
    try{
        user = jsonwebtoken.verify(token, "user");
    }catch (e) {
        console.log(e);
    }
    let email = user.email;
    let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
    let username = users[0].username;
    let name = users[0].name;
    let password = users[0].password;
    let tanggal_lahir = users[0].tanggal_lahir;
    let saldo = users[0].saldo;
    let result = {
        "Email" : email,
        "Username" : username,
        "Name" : name,
        "Password" : password,
        "Tanggal Lahir" : tanggal_lahir,
        "Saldo" : saldo
    }
    return res.status(200).send(result);
})

app.post('/client/topup', async (req, res)=>{
    const token = req.header("x-auth-token");
    let user = {}, result = {};
    let temp = req.body.saldo;
    if(!token){
        res.status(400).send("Unauthorized");
    }
    try {
        user = jsonwebtoken.verify(token, "user");
    }catch (e) {
        res.status(401).send("Unauthorized");
    }
    if (user.role != "client"){
        return res.status(401).send("Role bukan client");
    }
    else {
        let email = user.email;
        let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
        let saldo_awal = users[0].saldo;
        let saldo = parseInt(saldo_awal) + parseInt(temp);
        result = {
            "saldo_awal" : saldo_awal,
            "Saldo_akhir" : saldo
        }
        let topup = await dbase.executeQuery(`update user_account set saldo = '${saldo}' where email = '${email}'`)
        return res.status(200).send(result);
    }
})

app.post('/client/subscription', async (req,res)=>{
    const token = req.header("x-auth-token");
    let user = {}, result = {};
    if(!token){
        return res.status(401).send("Unauthorized");
    }
    try {
        user = jsonwebtoken.verify(token, "user");
    }catch (e) {
        return res.status(401).send("Unauthorized");
    }
    if (user.role != "client"){
        return res.status(401).send("Unauthorized");
    }
    if (user.saldo < 100){
        return res.status(400).send("Saldo tidak cukup");
    }
    else{
        let email = user.email;
        let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
        let temp = users[0].saldo;
        let api_temp = users[0].api_hit;
        let api_hit = parseInt(api_temp) + 10;
        let saldo = parseInt(temp) - 100;

        let subs = await dbase.executeQuery(`update user_account set saldo = '${saldo}', api_hit = '${api_hit}' where email = '${email}'`)
        result = {
            "Saldo_awal" : "Rp "+ temp,
            "Api_hit_awal" : api_temp,
            "Saldo_ahir " : saldo,
            "Api_hit" : api_hit
        }
        return res.status(200).send(result);

    }
})

app.get('/client/consultation', async (req,res)=>{
    const token = req.header("x-auth-token");
    let user = {};
    let result = {};
    if (!token){
        return res.status(401).send("Unauthoriezed");
    }
    try{
        user = jsonwebtoken.verify(token, "user");
    }catch (e) {
        return res.status(401).send("Unauthorized");
    }
    if(user.role != "client"){
        return res.status(400).send("Harus Role User");
    }
    else {
        let email = user.email;
        let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
        let api_hit_awal = users[0].api_hit;
        if(api_hit_awal < 1){
            return res.status(402).send("Silahkan Lakukan Subscripstion");
        }
        else{
            let api_hit = parseInt(api_hit_awal) - 1;
            let client = await dbase.executeQuery(`update user_account set api_hit = '${api_hit}' where email = '${email}'`);
            let consul = await dbase.executeQuery(`select * from consul where email_user = '${email}'`);
            if(consul.length == 0){
                return res.status(200).send("Belum ada riwayat check up");
            }
            else{
                let ress = [];
                for (i of consul){
                    result = {
                        "Id_consul" : i.id_consul,
                        "Email" : i.email_user,
                        "Name" : i.name,
                        "Doctor_name" : i.doctor_name,
                        "Info" : i.info
                    }
                    ress.push(result);
                }
                return res.status(200).send(ress);
            }
        }
    }
})


app.get(`/receptionist`,async(req, res) =>{
    const token = req.header("x-auth-token");
    let user = {}, errorResult = {}
    if(!token){``
        errorResult.token = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jsonwebtoken.verify(token, "user");
    }catch(err){
        errorResult.token = "token salah"
        res.status(401).send("Token Invalid");
    }
    let email = user.email;
    let users = await dbase.executeQuery(`select * from user_account where email = '${email}'`);
    let username = users[0].username;
    let name = users[0].name;
    let password = users[0].password;
    let tanggal_lahir = users[0].tanggal_lahir;
    let saldo = users[0].saldo;
    let tgl = dateFormat(tanggal_lahir);
    let result = {
        "Email" : email,
        "Username" : username,
        "Name" : name,
        "Password" : password,
        "Tanggal Lahir" : tgl,
        "Saldo" : saldo
    }
    return res.status(200).send(result);
})

app.get(`/dokter`,async(req, res) =>{
    const token = req.header("x-auth-token");
    let user = {}, errorResult = {}
    if(!token){
        errorResult.token = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jwt.verify(token, process.env.SECRET_KEY);
    }catch(err){
        errorResult.token = "token salah"
        res.status(401).send("Token Invalid");
    }
    if(await model.findBy('developer_account', 'email', user.email)){
        let result = await model.getAllUser('dokter')
        return res.status(200).send(result)
    }
})

//put dokter/developer/client sama tinggal ubah dikit aq blm cek ini jadi gak langsung ta copas"
app.put(`/receptionist`, async(req, res) =>{
    const token = req.header("x-auth-token");
    let nama = req.body.nama, tgl_lahir = req.body.tanggal_lahir, telp = req.body.no_telp, saldo = req.body.saldo
    let user = {}, errorResult = {}
    if(!token){
        errorResult.token = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jwt.verify(token, process.env.SECRET_KEY);
    }catch(err){
        errorResult.token = "token salah"
        res.status(401).send("Token Invalid");
    }
    if (nama.length < 1) {
        errorResult.nama = 'Nama tidak boleh kosong'
    }
    if (tgl_lahir.length < 1) {
        errorResult.tanggal_lahir = 'tanggal lahir tidak boleh kosong'
    }
    if (telp.length < 1) {
        errorResult.telephon = 'no telp tidak boleh kosong'
    }
    if (saldo.length < 1) {
        errorResult.saldo = 'saldo tidak boleh kosong'
    }
    let result = {
        email : user.email,
        nama : nama,
        tanggal_lahir : tgl_lahir,
        no_telp : telp,
        saldo : saldo
    }
    if(await model.cekDataEmail(user.email)){
        await model.updateData('client', user.email, nama, tgl_lahir, telp, saldo)
        return res.status(200).send(result)
    }
})

app.get('/jadwal', async (req, res)=>{
    const token = req.header("x-auth-token");
    let tgl = req.body.tanggal.split('/');
    let tanggal= tgl[2]+"-"+tgl[1]+"-"+tgl[0];
    let users = await dbase.executeQueryWithParam(`select * from schedule where tanggal = '${tanggal}'`);
    let user = {}, result = {};
    let ress = [];
    if(!token){
        msg = "Unauthorized"
        res.status(401).send("Unauthorized");
    }
    try{
        user = jsonwebtoken.verify(token,"218116679");
    }catch(err){
        msg = "token salah"
        res.status(401).send("Token Invalid");
    }
    for(i of users){
        result = {
            "Email" : i.email,
            "Doctor_name" : i.doctor_name,
            "No_Telp" : i.no_telp
        }
        ress.push(result);
    }
    return res.status(200).send(ress);
})

app.listen(process.env.PORT, () => {
    console.log(`Running to port ${process.env.PORT}`);
});

function dateFormat(dateTime) {
    var date = new Date(dateTime.getTime());
    date.setHours(0, 0, 0, 0);
    return date;
}

// const express=require('express');
// const app = express();
// app.set('view engine','ejs');
// const pengguna = require('./routes/pengguna');
// const resep = require('./routes/resep');
// const aksesapi = require('./routes/aksesapi');
// app.use(express.urlencoded({extended:true}));
// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// console.log(process.env.secret);
// // const useraktif = [{
// //     "username":"admin",
// //     "password":"admin",
// //     "api_key":"abcde01234"
// // }];
// const useraktif = [
//     {
//         "username":"admin",
//         "password":"admin",
//         "is_admin":1
//     },
//     {
//         "username":"upin",
//         "password":"upin",
//         "is_admin":0
//     }
// ];
// // app.post("/api/register", (req, res) => {
// //     const username = req.body.username;
// //     const password = req.body.password;
// //     const userbaru = {
// //         "username": username,
// //         "password": password,
// //         "api_key": Math.random().toString(36).substr(2, 8)
// //     };
// //     useraktif.push(userbaru);
// //     console.log(useraktif);
// //     return res.status(201).send({"username": userbaru.username, "api_key": userbaru.api_key});
// // });
// app.post("/api/register", (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;
//     const userbaru = {
//         "username": username,
//         "password": password,
//         "is_admin": 0
//     };
//     useraktif.push(userbaru);
//     console.log(useraktif);
//     return res.status(201).send({"username": userbaru.username, "is_admin": userbaru.is_admin});
// });
// app.post("api/login", (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;
//     let ada = null;
//     for (let index = 0; index < useraktif.length; index++) {
//         if (useraktif[index].username == username && useraktif[index].password == password) {            
//             ada = useraktif[index];
//         }
//     }
//     if (!ada) {
//         return res.status(400).send({"msg": "Username atau Password salah"});
//     }
//     let token = jwt.sign({"username": ada.username, "is_admin": ada.is_admin}, process.env.secret, {notBefore: "20s"});
//     return res.status(200).send({"token": token});
// });
// function cekJwt(req, res, next) {
//     if (!req.headers["x-auth-token"]) {
//         return res.status(401).send({"msg": "Token tidak ada"});
//     }
//     let token = req.headers["x-auth-token"];
//     let user = null;
//     try {
//         user = jwt.verify(token, process.env.secret);
//     } catch (error) {
//         return res.status(400).send(error);
//     }
//     req.user = user;
//     next();
// }
// // function cekApiKey(req, res, next) {
// //     if (!req.headers["x-api-key"]) {
// //         return res.status(401).send({"msg": "Anda tidak boleh mengakses API ini, sertakan API Key"});
// //     }
// //     let apikey = req.headers["x-api-key"];
// //     let ada = false;
// //     for (let index = 0; index < useraktif.length; index++) {
// //         if (useraktif[index].api_key == apikey) {
// //             ada = true;
// //         }
// //     }
// //     if (!ada) {
// //         return res.status(400).send({"msg": "API Key tidak terdaftar di sistem"});
// //     }
// //     req.isUserAktif = true;
// //     next();
// // }

// // middleware
// // app.get("/", cekApiKey, function (req,res) {
// //     console.log(req.isUserAktif);
// //     return res.render("displaymenu",{type:"Indonesian",menu:["batagor","rujak","kluntung"]})
// // });

// // middleware
// app.get("/", cekJwt, function (req,res) {
//     console.log(req.user);
//     return res.render("displaymenu",{type:"Indonesian",menu:["batagor","rujak","kluntung"]})
// });
// app.use("/api/pengguna",pengguna);
// app.use("/api/resep",resep);
// app.use("/api/aksesapi",aksesapi);
// app.listen(3000,function () {
//     console.log("Listening to port 3000")
// })

const express = require('express');
const app = express();
app.set('view engine', 'ejs');
const axios = require('axios').default;
const fs = require('fs');
const morgan = require('morgan');
const request = require('request');
app.use(express.urlencoded({extended : true}));
const jsonwebtoken = require('jsonwebtoken');
const port = process.env.PORT || 8080;
require('dotenv').config();
// console.log(process.env.secret);

app.post('/login', async(req, res) => {
    try {
        const hasil = await axios.get("https://sandbox-authservice.priaid.ch/login");
        console.log(hasil);
    } catch (error) {
        console.log(error);
    }
    // if (condition) {
        
    // }
    // return res.status()
});

app.get('/symptoms', async(req, res) => {
    // const hasil = await axios.get("https://sandbox-healthservice.priaid.ch/symptoms");
    // console.log(hasil);
    // if (!res) {
    //     return res.status(400).json({
    //         error: "symptoms are in invalid format!",
    //     });
    // } else {
    //     return res.status(200).json(res);
    // }
    
});

app.listen(port, () => {
    console.log("Listening to port 8080");
});
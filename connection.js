var mysql = require("mysql");
var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "proyeK_soa"
});

const executeQueryWithParam = async (query, param) => {
    return new Promise((resolve, reject) => {
        pool.query(query, param, (err, rows, fields) => {
            if (err) reject(err);
            else resolve(rows);
        })
    })
}

module.exports= {
    'executeQueryWithParam' : executeQueryWithParam,
}
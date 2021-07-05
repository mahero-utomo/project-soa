const dbase = require("./connection");
const generateApiKey = require('generate-api-key');

// const checkBy = async(table, by, value) => {
//     let result = await dbase.executeQueryWithParam(`select * from ${table} where lower(${by}) = lower(?)`,[value])
//     return result.length
// }

// const changePass = async( table, email, password) => {
//     return await dbase.executeQueryWithParam(`UPDATE ${table} SET password=${password} WHERE email = ${email}`) 
// }

// const updateData = async( table, email, name, tanggal_lahir, no_telp, saldo) => {
//     return await dbase.executeQueryWithParam(`UPDATE ${table} SET nama=${name}, tanggal_lahir = '${tanggal_lahir}', no_telp = '${no_telp}', saldo = '${saldo}' WHERE email = ${email}`) 
// }

// const getAllUser = async(role) => {
//     let result = await dbase.executeQueryWithParam(`select * from client where role = lower('${role}')`)
//     return result.length
// }

// const checkPassword = async(table, email, password) => {
//     let result = await dbase.executeQueryWithParam(`select * from ${table} where upper(email) = upper(?) and password = ?`,[email, password])
//     return result.length
// }

// const findBy = async(table, by, value) => {
//     return await dbase.executeQueryWithParam(`select * from ${table} where upper(${by}) = upper(?)`,[value])
// }

// const getPassword = async(table, by, value) => {
//     let result = await dbase.executeQueryWithParam(`select password from ${table} where upper(${by}) = upper(?)`,[value])
//     return result[0].password
// }

// const validateEmail = async(email) => {
//     return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
// }

// const validateUsername = async(username) => {
//     return /^[a-zA-Z0-9-_]+$/.test(username)
// }

// const registerDeveloper = async(email, username, name, password) => {
//     return await dbase.executeQueryWithParam(`insert into developer values(?,?,?,?)`,[email, username, name, password])
// }

// const registerUser = async(email, username, name, password, tanggal_lahir, no_telp, saldo, role) => {
//     return await dbase.executeQuery(`insert into client values('${email}','${username}','${name}','${password}','${tanggal_lahir}','${no_telp}','${saldo}', '${role}')`)
// }

// const cekDataEmail = async(email) =>{
//     return await dbase.executeQuery(`select * from client where email = '${email}'`);
// }

// const cekDataUsername = async (username) =>{
//     return await dbase.executeQuery(`select * from client where username = '${username}'`);
// }

// const loginClient = async (email, password) =>{
//     return await dbase.executeQuery(`select * from client where email = '${email}' and password = '${password}'`)
// }

// const updateClient = async (email, username, name, no_telp) =>{
//     return await dbase.executeQuery(`update client set username=${username}, name=${name}, no_telp=${no_telp} where email=${email}`)
// }

// const updatePasswordClient = async (table, email, password) =>{
//     return await dbase.executeQueryWithParam(`UPDATE ${table} SET password=${password} WHERE email = ${email}`)
// }

module.exports = {
    checkBy: async(table, by, value) => {
        let result = await dbase.executeQueryWithParam(`select * from ${table} where lower(${by}) = lower(?)`,[value])
        return result.length
    },
    changePass: async(table, email, password) => {
        return await dbase.executeQueryWithParam(`UPDATE ${table} SET password=${password} WHERE email = ${email}`) 
    },
    updateData: async(table, email, name, tanggal_lahir, no_telp, saldo) => {
        return await dbase.executeQueryWithParam(`UPDATE ${table} SET nama=${name}, tanggal_lahir = '${tanggal_lahir}', no_telp = '${no_telp}', saldo = '${saldo}' WHERE email = ${email}`) 
    },
    getAllUser: async(role) => {
        let result = await dbase.executeQueryWithParam(`select * from client where role = lower('${role}')`)
        return result.length
    },
    // ApiKeyGenerate: async() => {
    //     // let kode = "", alphanum = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    //     // while (kode.length <= 31) {
    //     //     let rand_num = (Math.floor(Math.random() * alphanum.length))
    //     //     kode += alphanum.substring(rand_num, rand_num + 1)
    //     // }
    //     // return kode
    //     return generateApiKey()
    // },
    checkPassword: async(table, email, password) => {
        let result = await dbase.executeQueryWithParam(`select * from ${table} where upper(email) = upper(?) and password = ?`,[email, password])
        return result.length
    },
    findBy: async(table, by, value) => {
        return await dbase.executeQueryWithParam(`select * from ${table} where upper(${by}) = upper(?)`,[value])
    },
    getUsername: async(table, by, value) => {
        let result = await dbase.executeQueryWithParam(`select username from ${table} where lower(${by}) = lower(?)`,[value])
        return result[0].username
    },
    getPassword: async(table, by, value) => {
        let result = await dbase.executeQueryWithParam(`select password from ${table} where upper(${by}) = upper(?)`,[value])
        return result[0].password
    },
    validateEmail: async(email) => {
        return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
    },
    validateUsername: async(username) => {
        return /^[a-zA-Z0-9-_]+$/.test(username)
    },
    registerDeveloper: async(email, username, name, password) => {
        return await dbase.executeQueryWithParam(`insert into developer values(?,?,?,?,?,?,?,?)`,[email, username, name, , password, generateApiKey({method: 'string', length: 32}), 100, "free"])
    },
    uploadPhoto: async(photo, email) => {
        return await dbase.executeQuery(`update developer set profile_photo = ${photo} where email = ${email}`)
    },
    updateDeveloper: async(username, name, email) => {
        return await dbase.executeQuery(`update developer set username = '${username}', name = '${name}'  where email = ${email}`)
    },
    registerUser: async(email, username, name, password, tanggal_lahir, no_telp, saldo, role, api_hit) => {
        return await dbase.executeQuery(`insert into user_account values('${email}','${username}','${name}','${password}','${tanggal_lahir}','${no_telp}','${saldo}', '${role}', '${api_hit}')`)
    },
    cekDataEmail: async(email) =>{
        return await dbase.executeQuery(`select * from user_account where email = '${email}'`);
    },
    cekDataUsername: async (username) =>{
        return await dbase.executeQuery(`select * from user_account where username = '${username}'`);
    },
    loginClient: async (email, password) =>{
        return await dbase.executeQuery(`select * from user_account where email = '${email}' and password = '${password}'`)
    },
    updateClient: async (email, username, name, no_telp) =>{
        return await dbase.executeQuery(`update user_account set username=${username}, name=${name}, no_telp=${no_telp} where email=${email}`)
    },
    updatePasswordClient: async (table, email, password) =>{
        return await dbase.executeQueryWithParam(`UPDATE ${table} SET password=${password} WHERE email = ${email}`)
    },
}


// module.exports = {
//     'checkBy' : checkBy,
//     'updateData' : updateData,
//     'getAllUser' : getAllUser,
//     'changePass' : changePass,
//     'checkPassword' : checkPassword,
//     'findBy' : findBy,
//     'getPassword' : getPassword,
//     'validateEmail' : validateEmail,
//     'validateUsername' : validateUsername,
//     'registerDeveloper' : registerDeveloper,
//     'registerUser' : registerUser,
//     'cekDataEmail' : cekDataEmail,
//     'cekDataUsername' : cekDataUsername,
//     'loginClient' : loginClient,
//     'updateClient' : updateClient,
//     'updatePasswordClient': updatePasswordClient
// }

// const checkBy = async(by, value) => {
//     let result = await dbase.executeQueryWithParam(`select * from user where lower(${by})=lower(?)`,[value])
//     return result.length
// }

// const findAll = async() => {
//     return await dbase.executeQueryWithParam(`select * from user`,[])
// }

// const registerUser = async(username, nama, email, role) => {
//     return await dbase.executeQueryWithParam(`insert into user values(?,?,?,?)`,[username, nama, email, role])
// }

// const usernameRole = async(username, role) => {
//     let result = await dbase.executeQueryWithParam(`select * from user where upper(username)=upper(?) and role = '${role}'`,[username])
//     return result.length
// }

// const generateKode = async() => {
//     let kode = "", alphanum = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
//     while (kode.length <= 5) {
//         let rand_num = (Math.floor(Math.random() * alphanum.length))
//         kode += alphanum.substring(rand_num, rand_num + 1)
//     }
//     return kode
// }

// const checkKode = async(kode) => {
//     let result = await dbase.executeQueryWithParam(`select count(kode_kelas) count from kelas where lower(kode_kelas) = lower(?)`,[kode])
//     return result[0].count
// }

// const findKode = async(kode) => {
//     let result = await dbase.executeQueryWithParam(`select kode_kelas from kelas where kode_kelas = ?`,[kode])
//     return result[0].kode_kelas
// }

// const findUsername = async(username) => {
//     let result = await dbase.executeQueryWithParam(`select username from user where username = ?`,[username])
//     return result[0].username
// }

// const createClass = async(kode, nama, username) => {
//     return await dbase.executeQueryWithParam(`insert into kelas values(?,?,?)`,[kode, nama, username])
// }

// const findClassBy = async(kode) => {
//     let result = await dbase.executeQueryWithParam(`select * from kelas where kode_kelas=?`,[kode])
//     return result[0]
// }

// const checkClass = async(kode, username, by) => {
//     let result = await dbase.executeQueryWithParam(`select count(*) count from ${by} where upper(kode_kelas) = upper(?) and lower(username) = lower(?)`,[kode, username])
//     return result[0].count
// }

// const joinClass = async(kode, username) => {
//     return await dbase.executeQueryWithParam(`insert into kelas_siswa values(0,?,?)`,[kode, username])
// }

// const allClass = async() => {
//     return await dbase.executeQueryWithParam(`select k.nama_kelas, k.kode_kelas, count(ks.kode_kelas) jumlah_siswa from kelas k inner join kelas_siswa ks on ks.kode_kelas = k.kode_kelas group by k.nama_kelas, k.kode_kelas union select k.nama_kelas, k.kode_kelas, sum(k.kode_kelas) jumlah_siswa from kelas k where not exists(select null from kelas_siswa ks where k.kode_kelas = ks.kode_kelas) group by k.kode_kelas order by kode_kelas`,[])
// }

// const generateKodeTask = async() => {
//     let kode = "", amount = await dbase.executeQueryWithParam(`select count(*) count from tugas`,[]), result = amount[0].count + 1
//     if (result < 1000) kode += "0"
//     if (result < 100) kode += "0"
//     if (result < 10) kode += "0"
//     return "T" + kode + result
// }

// const addTask = async(id, nama, kode) => {
//     return await dbase.executeQueryWithParam(`insert into tugas values(?,?,?)`,[id, nama, kode])
// }

// const findTaskBy = async(kode) => {
//     let result = await dbase.executeQueryWithParam(`select * from tugas where upper(kode_tugas)=upper(?)`,[kode])
//     return result.length ? result[0] : null
// }

// const userTaskInClass = async(kode, username) => {
//     let result = await dbase.executeQueryWithParam(`select count(ks.username) count from kelas_siswa ks inner join tugas t on ks.kode_kelas = t.kode_kelas and t.kode_tugas = ? and lower(ks.username) = lower(?)`,[kode, username])
//     return result[0].count
// }

// const turnInTask = async (kode, nama, username) => {
//     return await dbase.executeQueryWithParam(`insert into file_tugas values(0,?,?,?)`,[kode, nama, username])
// }

// const fileTaskExist = async (kode, nama, username) => {
//     let result = await dbase.executeQueryWithParam(`select count(*) count from file_tugas where kode_tugas=? and nama_file like ? and username=?`,[kode, nama + "%", username])
//     return result[0].count
// }

// const idTaskExist = async (kode, nama, username) => {
//     let result = await dbase.executeQueryWithParam(`select id from file_tugas where kode_tugas=? and nama_file like ? and username=?`,[kode, nama + "%", username])
//     return result[0].id
// }

// const deleteTaskExist = async (id) => {
//     return await dbase.executeQueryWithParam(`delete from file_tugas where id = ?`,[id])
// }

// const historyTaskTeacher = async (username) => {
//     return await dbase.executeQueryWithParam(`select t.kode_tugas, t.nama_tugas, t.kode_kelas, count(f.kode_tugas) jumlah_pengumpul from tugas t inner join file_tugas f on t.kode_tugas = f.kode_tugas inner join kelas k on t.kode_kelas = k.kode_kelas and upper(k.username) = upper(?) group by t.kode_tugas order by t.kode_tugas`,[username])
// }

// const historyTaskStudent = async (username) => {
//     return await dbase.executeQueryWithParam(`select f.kode_tugas, t.nama_tugas, t.kode_kelas from file_tugas f inner join tugas t on f.kode_tugas = t.kode_tugas and lower(f.username) = lower(?) order by f.kode_tugas`,[username])
// }

// module.exports = {
//     'checkBy' : checkBy,
//     'findAll' : findAll,
//     'registerUser' : registerUser,
//     'usernameRole' : usernameRole,
//     'generateKode' : generateKode,
//     'checkKode' : checkKode,
//     'findKode' : findKode,
//     'findUsername' : findUsername,
//     'createClass' : createClass,
//     'findClassBy' : findClassBy,
//     'checkClass' : checkClass,
//     'joinClass' : joinClass,
//     'allClass' : allClass,
//     'generateKodeTask' : generateKodeTask,
//     'addTask' : addTask,
//     'findTaskBy' : findTaskBy,
//     'userTaskInClass' : userTaskInClass,
//     'turnInTask' : turnInTask,
//     'fileTaskExist' : fileTaskExist,
//     'idTaskExist' : idTaskExist,
//     'deleteTaskExist' : deleteTaskExist,
//     'historyTaskTeacher' : historyTaskTeacher,
//     'historyTaskStudent' : historyTaskStudent,
// }
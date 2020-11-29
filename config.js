const config = {
    server: process.env.DBServer,
    options: {
        database: process.env.DBName,
        rowCollectionOnDone: true

        //encrypt: true
    },
    authentication:{
        type: "default",
        options: {
            userName: process.env.DBUsername,
            password: process.env.DBPassword
        }
    }
}

module.exports = config
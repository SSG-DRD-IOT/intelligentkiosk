module.exports = {
    database: {
        file: "./db/data.db"
    },

    mqtt: {
        backingStore: {

        },
        port: 1883,
        host: 'localhost',
        http: {port: 3000, bundle: true, static: './'}  
    }
}
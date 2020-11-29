const { Connection, Request } = require('tedious');
const config = require('../config');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
   
    const getData =() => {
          
            return new Promise((resolve, reject)=> {

                const connection = new Connection(config)

                connection.on("connect", err => {
                    if(err){
                            reject(`Connection failed: ${err.message}`)      
                    } 
                    const request = new Request(
                        `SELECT * FROM AcademicYears
                        ORDER BY Title DESC;
                        `, 
                         (err, rowCount)=> {
                        if(err){
                            reject(err.message)
                    } 
                });
                connection.execSql(request);

                const academicYears = []
                request.on('row', columns => {
                    //start with an object
                    const academicYear= {}
                    // create a new object/document
                    columns.forEach(column => {
                        //add new data to the object
                        academicYear[column.metadata.colName] = column.value
                    })
                    academicYears.push(academicYear)
                })

                request.on('doneInProc', () => {
                    resolve(academicYears)
                })
            })        
        })
    }

    let result;

    try{
        context.res = {
            body: await getData(),
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }catch(err){
        context.res = {
            status: 400,
            body:err
        }
    }

};
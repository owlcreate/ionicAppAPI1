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
                        `SELECT * FROM Courses
                         ORDER BY CourseCode;
                        `, 
                         (err, rowCount)=> {
                        if(err){
                            reject(err.message)
                    } 
                });
                connection.execSql(request);
               
                const courses = []
                request.on('row', columns => {
                    //start with an object
                    const course = {}
                    // create a new object/document
                    columns.forEach(column => {
                        //add new data to the object
                        course[column.metadata.colName] = column.value
                    })
                    courses.push(course)
                })

                request.on('doneInProc', () => {
                    resolve(courses)
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
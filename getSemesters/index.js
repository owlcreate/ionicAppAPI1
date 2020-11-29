const { Connection, Request } = require('tedious');
const config = require('../config')

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.')

    const getData = () => { //return a promise instead of the actual data
        return new Promise((resolve, reject) => {

            const connection = new Connection(config)

            connection.on('connect', err => {
                if(err){
                    reject(`Connection Failed: ${err.message}`)
                }

                const request = new Request(
                    `SELECT s.Id, s.Name, s.StartDate, s.EndDate, a.Title AS AcademicYear 
                    FROM semesters s 
                    INNER JOIN academicyears a ON s.academicyearId = a.id`, 
                    (err, rowCount) => {
                        if(err){
                            reject(err.message)
                        }
                    //resolve(`Retrieved ${rowCount} rows`)
                });

                connection.execSql(request);

                request.on('doneInProc', (rowCount, more, rows) => { 
                    const semesters = []

                    rows.forEach(row => {
                        const semester = {}
                        row.forEach(column => {
                            semester[column.metadata.colName] = column.value
                        })
                        semesters.push(semester)
                    })

                    resolve(semesters)
                })

            })
        })
    }


    let result;

    //context.res.setHeader('foo', 'bar')
    try{
        context.res = {
            //return 200
            body: await getData(),
            headers: {
                'Content-Type': 'application/json'
            }
        }
    } catch(err){
        context.res = {
            status: 400,
            body: err
        }
    }


};
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
                        `SELECT DiplomaPrograms.Id, DiplomaPrograms.Title, COUNT(DiplomaPrograms.Id) AS DurationInYears
                        FROM DiplomaPrograms
                        INNER JOIN DiplomaProgramYears on DiplomaPrograms.Id = DiplomaProgramYears.DiplomaProgramId
                        GROUP BY DiplomaPrograms.Id, DiplomaPrograms.Title;
                        `, 
                         (err, rowCount)=> {
                        if(err){
                            reject(err.message)
                    } 
                });
                connection.execSql(request);
                
                const diplomaprograms = []
                request.on('row', columns => {
                    //start with an object
                    const diplomaprogram = {}
                    // create a new object/document
                    columns.forEach(column => {
                        //add new data to the object
                        diplomaprogram[column.metadata.colName] = column.value
                    })
                    diplomaprograms.push(diplomaprogram)
                })

                request.on('doneInProc', () => {
                    resolve(diplomaprograms)
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
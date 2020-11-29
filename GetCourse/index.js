const { Connection, Request } = require('tedious');
const config = require('../config')

module.exports = async function (context, req) {
    const getData = () => { //return a promise instead of the actual data
        return new Promise((resolve, reject) => {

            const connection = new Connection(config)

            connection.on('connect', err => {
                if(err){
                    reject(`Connection Failed: ${err.message}`)
                }

                const request = new Request(
                    `SELECT c.Id,
                    c.Title,
                    c.CourseCode,
                    cp.PrerequisiteId,
                    cpr.CourseCode,
                    cpr.Title,
                    pr.CourseId,
                    prf.CourseCode,
                    prf.Title
                    FROM Courses as c
                    LEFT JOIN CoursePrerequisites cp on c.Id = CP.CourseId
                    LEFT JOIN Courses AS cpr ON  cp.PrerequisiteId = cpr.Id
                    LEFT JOIN CoursePrerequisites AS pr ON c.Id = pr.PrerequisiteId
                    LEFT JOIN Courses as prf ON  pr.CourseId = prf.Id
                    WHERE c.id = ${req.params.id}
                    ORDER BY c.CourseCode;`, 
                    (err, rowCount) => {
                        if(err){
                            reject(err.message)
                        }
                    //resolve(`Retrieved ${rowCount} rows`)
                });

                connection.execSql(request);

                request.on('doneInProc', (rowCount, more, rows) => { 
                    
                    if(rowCount === 0){
                        //return with 404
                        resolve('Not found')
                    } else {
                        const course = {}
                        
                        //fill the basic course data into object

                        course.Id = rows[0][0].value
                        course.Title = rows[0][1].value
                        course.CourseCode = rows[0][2].value

                        const coursePrerequisites = []
                        
                        rows.forEach(row => {
                            const coursePrerequisite= {} 
                            if (row[4].value && row[5].value){
                                
                                coursePrerequisite.CourseCode = row[4].value
                                coursePrerequisite.Title = row[5].value
                            
                            coursePrerequisites.push(coursePrerequisite)

                            }
                            

                        })

                        const isPrerequisitesFor = []
                        rows.forEach(row => {
                            const isPrerequisiteFor = {}
                            if (row[7].value && row[8].value){
                            isPrerequisiteFor.CourseCode = row[7].value
                            isPrerequisiteFor.CourseTitle = row[8].value
                            
                            isPrerequisitesFor.push(isPrerequisiteFor)
                            }


                            
                        })

                        course.CoursePrerequisite = removeDuplicates(coursePrerequisites, "CourseCode")
                        course.IsPrerequisiteFor = isPrerequisitesFor
                        resolve(course)
                    }
                    function removeDuplicates(myArr, prop) {
                        return myArr.filter((obj, pos, arr) => {
                            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
                        });
                    }
                    
                })
                
            })
            
        })
    }
    
    let result;

    try{
        let body = await getData();  //returns a promise
        let status;

        if(body === 'Not found'){
            status = 404;
            body = null;
        } else {
            status = 200;
        }

        context.res = {
            status,
            body,
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
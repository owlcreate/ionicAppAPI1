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
                    `SELECT DISTINCT 
                    S.Id, 
                    S.Name, 
                    S.StartDate, 
                    S.EndDate,
                     C.Title, 
                     C.CourseCode 
                     FROM Semesters S
                     LEFT JOIN CourseOfferings CO on S.Id = CO.SemesterId
                     LEFT JOIN Courses C on CO.CourseId = C.Id
                     WHERE S.Id = ${req.params.id}
                     ORDER BY C.CourseCode;`, 
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
            const semester = {}
            
            //fill the basic course data into object

            semester.Id = rows[0][0].value
            semester.Name = rows[0][1].value
            semester.StartDate = rows[0][2].value
            semester.EndDate= rows[0][3].value


            const coursesTaught = []
            rows.forEach(row => {
                const course = {}

                course.CourseCode = row[4].value
                course.Title = row[5].value
                coursesTaught.push(course)
            })

       
            semester.CoursesTaught = coursesTaught
            resolve(semester)
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
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
                    `SELECT DiplomaPrograms.Id,
                    DiplomaPrograms.Title,
                     Instructors.FirstName,
                     Instructors.LastName,
                     AdvisingAssignments.InstructorId,
                     AcademicYears.Title,
                     DiplomaProgramYears.Title,
                     DiplomaProgramYearSections.Title
             FROM DiplomaPrograms
             INNER JOIN DiplomaProgramYears on DiplomaPrograms.Id = DiplomaProgramYears.DiplomaProgramId
             INNER JOIN DiplomaProgramYearSections on DiplomaProgramYears.Id = DiplomaProgramYearSections.DiplomaProgramYearId
             INNER JOIN AdvisingAssignments on DiplomaProgramYearSections.Id = AdvisingAssignments.DiplomaProgramYearSectionId
             INNER JOIN Instructors on AdvisingAssignments.InstructorId = Instructors.Id
             INNER JOIN AcademicYears on DiplomaProgramYearSections.AcademicYearId = AcademicYears.Id
             WHERE DiplomaPrograms.Id = ${req.params.id}
             ORDER BY AcademicYears.Title DESC, DiplomaProgramYears.Title, DiplomaProgramYearSections.Title;`, 
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
                        const diplomaProgram = {}
                        
                        //fill the basic course data into object

                        diplomaProgram.Id = rows[0][0].value
                        diplomaProgram.Title = rows[0][1].value


                        const advisors = []
                        rows.forEach(row => {
                            const programAdvisor = {}

                            programAdvisor.Instructor = `${row[2].value} ${row[3].value}`
                            programAdvisor.AcademicYears = row[5].value
                            programAdvisor.DiplomaProgramYears = row[6].value
                            programAdvisor.DiplomaProgramYearSection = row[7].value
                            
                            advisors.push(programAdvisor)
                        })

                        diplomaProgram.Advisors = advisors
                        resolve(diplomaProgram)
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
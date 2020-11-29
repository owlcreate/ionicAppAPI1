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
                    `SELECT AcademicYears.Id, 
                    AcademicYears.Title,
                    Semesters.Id,
                    Semesters.name, 
                    Semesters.StartDate, 
                    Semesters.EndDate,
                    DiplomaProgramYearSections.Title,
                    AdvisingAssignments.InstructorId,
                    DiplomaProgramYears.Title,
                    DiplomaPrograms.Title,
                    Instructors.LastName, 
                    Instructors.FirstName
                    FROM AcademicYears
                    
                    INNER JOIN Semesters ON AcademicYears.Id= Semesters.AcademicYearId
                    INNER JOIN DiplomaProgramYearSections ON AcademicYears.Id = DiplomaProgramYearSections.AcademicYearId
                    INNER JOIN AdvisingAssignments  on DiplomaProgramYearSections.Id = AdvisingAssignments.DiplomaProgramYearSectionId
                    INNER JOIN DiplomaProgramYears  on DiplomaProgramYearSections.DiplomaProgramYearId = DiplomaProgramYears.Id
                    INNER JOIN DiplomaPrograms on DiplomaProgramYears.DiplomaProgramId = DiplomaPrograms.Id
                    INNER JOIN Instructors  on AdvisingAssignments.InstructorId = Instructors.Id
                    WHERE AcademicYears.Id = ${req.params.id}
                    ORDER BY DiplomaPrograms.title, DiplomaProgramYears.Title, DiplomaProgramYearSections.Title;`, 
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
                        const academicYear = {}
                        
                        //fill the basic course data into object

                        academicYear.Id = rows[0][0].value
                        academicYear.Title = rows[0][1].value

                        const semesters = []
                        rows.forEach(row => {
                            const semester = {}
                            semester.Id= row[2].value
                            semester.Name = row[3].value
                            semester.StartDate= row[4].value
                            semester.EndDate= row[5].value
                            semesters.push(semester)
                        })

                        // fill the advisingassignments array
                        const advisingAssignments = []
                        rows.forEach(row => {
                            const academicAdvising = {}

                            academicAdvising.Instructor = `${row[10].value} ${row[9].value}`
                            academicAdvising.AcademicYear = row[1].value
                            academicAdvising.DiplomaProgram = row[8].value
                            academicAdvising.DiplomaProgramYear = row[7].value
                            academicAdvising.DiplomaProgramYearSection = row[5].value
                            advisingAssignments.push(academicAdvising)
                        })
                   
                   
                        academicYear.Semester = removeDuplicates(semesters, "Name")
                        academicYear.AdvisingAssignments = removeDuplicates(advisingAssignments, "Instructor")
                        resolve(academicYear)
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
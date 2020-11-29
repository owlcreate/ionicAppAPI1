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
                    Instructors.Id, 
                    Instructors.FirstName, 
                    Instructors.LastName,
                    AdvisingAssignments.InstructorId,
                    AcademicYears.Title,
                    DiplomaPrograms.Title,
                    DiplomaProgramYears.Title,
                    DiplomaProgramYearSections.Title,
                    CourseOfferings.CourseId,
                    Courses.CourseCode, 
                    Courses.Title,
                    Courses.Id
                    FROM Instructors
                    INNER JOIN AdvisingAssignments on Instructors.Id = AdvisingAssignments.InstructorId
                    INNER JOIN CourseOfferings on Instructors.Id = CourseOfferings.InstructorId
                    INNER JOIN Courses  on CourseOfferings.CourseId = Courses.Id
                    INNER JOIN DiplomaProgramYearSections on AdvisingAssignments.DiplomaProgramYearSectionId = DiplomaProgramYearSections.Id
                    INNER JOIN DiplomaProgramYears on DiplomaProgramYearSections.DiplomaProgramYearId = DiplomaProgramYears.Id
                    INNER JOIN AcademicYears on DiplomaProgramYearSections.AcademicYearId = AcademicYears.Id
                    INNER JOIN DiplomaPrograms on DiplomaProgramYears.DiplomaProgramId = DiplomaPrograms.Id
                    WHERE Instructors.Id = ${req.params.id}
                    ORDER BY AcademicYears.Title, DiplomaProgramYears.Title, DiplomaProgramYearSections.Title, DiplomaPrograms.Title, Courses.CourseCode;`, 
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
                        const instructor = {}
                        
                        //fill the basic course data into object

                        instructor.Id = rows[0][0].value
                        instructor.FirstName = rows[0][1].value
                        instructor.LastName = rows[0][2].value


                        const coursesTaught = []
                        rows.forEach(row => {
                            const course = {}

                            course.Id =row[11].value
                            course.CourseCode = row[9].value
                            course.Title = row[10].value
                            coursesTaught.push(course)
                        })

                        // fill the advisingassignments array
                        const advisingAssignments = []
                        rows.forEach(row => {
                            const academicAdvising = {}

                            academicAdvising.AcademicYear = row[4].value
                            academicAdvising.DiplomaProgram = row[5].value
                            academicAdvising.DiplomaProgramYear = row[6].value
                            academicAdvising.DiplomaProgramYearSection = row[7].value
                            advisingAssignments.push(academicAdvising)
                        })
                   
                   
                        instructor.CoursesTaught = removeDuplicates(coursesTaught, "CourseCode")
                        instructor.AdvisingAssignments = removeDuplicates(advisingAssignments, "DiplomaProgramYear")
                       //instructor.AdvisingAssignments = advisingAssignments
                        resolve(instructor)
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
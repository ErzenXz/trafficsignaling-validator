
async function calculateFileHash(fileInput) {
    try {
        let file = fileInput.files[0];
        let chunkSize = 64 * 1024; // 64 kilobytes

        // Use FileReader to read the file asynchronously in chunks
        const calculateHashChunk = async (start, end) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const chunkData = event.target.result;
                    resolve(chunkData);
                };
                reader.onerror = (error) => reject(error);
                reader.readAsArrayBuffer(file.slice(start, end));
            });
        };

        // Calculate the hash using SubtleCrypto API in chunks
        let hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(0));

        for (let start = 0; start < file.size; start += chunkSize) {
            let end = Math.min(start + chunkSize, file.size);
            let chunkData = await calculateHashChunk(start, end);
            hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(chunkData));
        }

        let hashArray = Array.from(new Uint8Array(hashBuffer));
        let fileHash = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

        // Trim the hash to a maximum of 512 characters
        let trimmedHash = fileHash.slice(0, 512);

        return trimmedHash;
    } catch (error) {
        console.error('Error calculating file hash:', error.message);
        return null;
    }
}

let uhash;
let db = firebase.firestore();

function readTextFromFiles(file1, file2, callback) {
    const reader1 = new FileReader();
    const reader2 = new FileReader();

    // Read file1
    reader1.onload = function (event) {
        const text1 = event.target.result;

        // Get File 1 HASH

        calculateFileHash(file1Input).then((hash1) => {
            uhash = hash1;
            document.getElementById("btn").classList.remove("hidden");
        });

        // Read file2
        reader2.onload = function (event) {
            const text2 = event.target.result;
            callback(text1, text2);
        };
        reader2.onerror = function (event) {
            console.error(`Error reading file2: ${event.target.error}`);
            callback(text1, null);
        };
        reader2.readAsText(file2);
    };
    reader1.onerror = function (event) {
        console.error(`Error reading file1: ${event.target.error}`);
        callback(null, null);
    };
    reader1.readAsText(file1);
}

const file1Input = document.getElementById('file1');
const file2Input = document.getElementById('file2');

let _text1, _text2;


file1Input.addEventListener('change', function (event) {
    const file1 = event.target.files[0];
    file2Input.addEventListener('change', function (event) {
        const file2 = event.target.files[0];
        readTextFromFiles(file1, file2, function (text1, text2) {
            if (text1 !== null && text2 !== null && text1 != text2) {
                _text1 = text1;
                _text2 = text2;
            } else {
                document.getElementById("btn").classList.add("hidden");

            }
        });
    });
});


let carsArr;
let carsAfter;


function validateData() {
    document.getElementById("loading").classList.remove("hidden");

    let input = _text1;
    let output = _text2;

    setTimeout(() => {
        parseInputDataSet(input);
        parseSubmittedDataSet(output);
        simulate();
        createInsights();
        let r = new Set(results);

        results = [...r];

        let table = generateTable(results);


        document.getElementById("result").classList.remove("hidden");
        document.getElementById("inputForm").classList.add("hidden");
        document.getElementById("info").innerHTML = table;
    }, 300);
}

function generateTable(dataArray) {
    let tableHTML = '<table>';
    tableHTML += '<thead><tr><th>Constraints</th><th>Result</th></tr></thead>';
    tableHTML += '<tbody>';

    // Loop through each string in the dataArray and generate a table row
    for (let i = 0; i < dataArray.length; i++) {
        let result = '<i class="fa-solid fa-check"></i>'; // default to a checkmark for normal results
        if (dataArray[i].indexOf('Error-Code') !== -1) {
            result = '<i class="fa-solid fa-xmark"></i>'; // if the string contains "error", use an x mark instead
        }

        // Generate the table row with the constraint and result columns
        tableHTML += '<tr>';
        tableHTML += `<td>${dataArray[i]}</td>`;
        tableHTML += `<td style="
        text-align: center;
    ">${result}</td>`;
        tableHTML += '</tr>';
    }

    tableHTML += '</tbody>';
    tableHTML += '</table>';

    setTimeout(() => {
        document.getElementById("loading").classList.add("hidden");

    }, 500);


    return tableHTML;
}



const dataset = {
    simulation: {
        duration: 0,
        numIntersections: 0,
        numStreets: 0,
        numCars: 0,
        bonusPoint: 0,
    },
    streets: {},
    cars: [],
};

const averageIntersectionSchedules = {
    greenCycles: 0,
    totalCycles: 0,
};

let ERROR_MESSAGE = "";
let error_status = false;

function parseInputDataSet(data) {

    try {
        const lines = data.split('\n');
        const [
            simulationDuration, numIntersections, numStreets, numCars, bonusPoint
        ] = parseLine(lines.shift(), [0, 1, 2, 3, 4]);

        dataset.simulation.duration = simulationDuration;
        dataset.simulation.numIntersections = numIntersections;
        dataset.simulation.numStreets = numStreets;
        dataset.simulation.numCars = numCars;
        dataset.simulation.bonusPoint = bonusPoint;

        for (let i = 0; i < numStreets; i++) {
            const [start, end, streetName, duration] = parseLine(lines[i], [0, 1, 3]);

            dataset.streets[streetName] = {
                start, end, duration, lastQueuingNumber: -1, nextQueuingNumber: 0
            };
        }

        for (let i = numStreets; i < numStreets + numCars; i++) {
            const [carNumStreets, ...streetNames] = parseLine(lines[i], [0]);

            dataset.cars.push({
                numStreets: carNumStreets,
                streetNames,
                currentStreetIdx: 0,
                currentStreetName: streetNames[0],
                remainingTimeOnStreet: 0,
                queuingNumber: dataset.streets[streetNames[0]].nextQueuingNumber++,
                arrived: false,
                score: 0,
                commuteTime: 0,
            });
        }
    } catch (error) {
        ERROR_MESSAGE = "FAILED TO PARSE INPUT FILE";
        error_status = true;
        return false;
    }

}

function parseLine(rawLine, stringToNumberArrayIndexes = []) {
    const parsedLine = rawLine.split(' ');

    return stringToNumberArrayIndexes.length
        ? parsedLine.map((value, i) =>
            stringToNumberArrayIndexes.includes(i) ? +value : value
        )
        : parsedLine;
}

let results = [

]


function parseSubmittedDataSet(data) {

    try {
        const lines = data.split('\n');
        const numIntersections = +lines.shift();
        const intersectionSchedulesById = {};
        let numSchedules = 0;
        let currentLine = 0;

        for (let i = 0; i < numIntersections; i++) {
            const intersectionId = lines[currentLine + i];
            const numIncomingStreets = lines[currentLine + i + 1];

            if (typeof numIncomingStreets === 'undefined') {
                results.push("The number of lines in the submitted file is less than the expected number. Error-Code: " + `Unexpected EOF (end of file) at line ${currentLine + i + 2}`);
                // throw new Error([
                //     'Submission file has fewer lines than expected',
                //     `Unexpected EOF (end of file) at line ${currentLine + i + 2}`,
                // ].join('. '));
            } else {
                results.push("The submitted file has the correct number of lines.");
            }

            if (isNaN(numIncomingStreets)) {
                results.push(`Invalid number of elements found at line ${currentLine + i + 3} Error-Code:` + `Invalid number of elements found at line ${currentLine + i + 3}`);
                // throw new Error(
                //     `Invalid number of elements found at line ${currentLine + i + 3}`
                // );
            } else {
                results.push("The submitted file has the expected number of elements.");
            }

            if (intersectionSchedulesById[intersectionId]) {
                results.push(`More than one adjustment was provided for intersection ${intersectionId}.` + `Error-Code: More than one adjustment was provided for intersection ${intersectionId}.`);
                // throw new Error(
                //     `More than one adjustment was provided for intersection ${intersectionId}.`
                // );
            } else {
                results.push("The submitted file has the valid number of adjustments.");
            }

            intersectionSchedulesById[intersectionId] = true;
            numSchedules += +numIncomingStreets;

            const streetNames = [];
            let lastScheduleTime = 0;

            for (let j = 0; j < +numIncomingStreets; j++) {
                const [streetName, schedule] = parseLine(lines[currentLine + i + 2 + j], [1]);

                if (
                    dataset.streets[streetName] &&
                    dataset.streets[streetName].end !== +intersectionId
                ) {
                    results.push("Submission file has invalid street names " + `Error-Code: The schedule of intersection ${intersectionId} refers to street ${streetName}, but that street does not enter this intersection, so it cannot be part of the intersection schedule.`);
                    // throw new Error([
                    //     `The schedule of intersection ${intersectionId} refers to street`,
                    //     `${streetName}, but that street does not enter this intersection,`,
                    //     'so it cannot be part of the intersection schedule.',
                    // ].join(' '));
                } else {
                    results.push("The submitted file has the proper street names.");
                }

                if (isNaN(schedule)) {
                    results.push("Submission file has invalid schedule " + `Error-Code: The schedule of street ${streetName} has a duration for green light that is not a number: ${schedule}.`);
                    // throw new Error([
                    //     `The schedule of street ${streetName} has a duration for green light`,
                    //     `that is not a number: ${schedule}.`,
                    // ].join(' '));
                } else {
                    results.push("The submitted file has the optimal schedule for green light.");
                }


                if (schedule < 1 || schedule > dataset.simulation.duration) {
                    results.push("Submission file has invalid schedule " + `Error-Code: The schedule of street ${streetName} should have duration for green light that is between 1 and ${dataset.simulation.duration}.`);
                    // throw new Error([
                    //     `The schedule of street ${streetName} should have duration`,
                    //     `for green light that is between 1 and ${dataset.simulation.duration}.`,
                    // ].join(' '));
                } else {
                    results.push("The submitted file has the reasonable schedule for duration.");
                }

                dataset.streets[streetName].schedule = {
                    gte: lastScheduleTime,
                    lte: lastScheduleTime + schedule - 1
                };
                streetNames.push(streetName);
                lastScheduleTime += schedule;
            }

            for (const streetName of streetNames) {
                dataset.streets[streetName].scheduledTimeWindow = lastScheduleTime;
            }

            averageIntersectionSchedules.totalCycles += lastScheduleTime;
            currentLine += +numIncomingStreets + 1;
        }

        averageIntersectionSchedules.greenCycles = averageIntersectionSchedules.totalCycles / numSchedules;
        averageIntersectionSchedules.totalCycles /= dataset.simulation.numIntersections;
    } catch (error) {
        ERROR_MESSAGE = "FAILED TO PARSE SUBMITTED FILE";
        error_status = true;
    }

}


function simulate() {

    try {
        let remainingTime = dataset.simulation.duration + 1;
        let time = 0;

        while (remainingTime--) {
            const isIntersectionCrossedInThisIteration = {};

            for (const car of dataset.cars) {
                if (car.arrived) {
                    continue;
                }

                if (
                    car.remainingTimeOnStreet === 1 &&
                    car.currentStreetIdx < car.numStreets - 1
                ) {
                    car.queuingNumber = dataset.streets[car.currentStreetName].nextQueuingNumber++;
                }

                if (car.remainingTimeOnStreet > 0) {
                    car.remainingTimeOnStreet--;
                }

                if (car.remainingTimeOnStreet === 0) {
                    if (car.currentStreetIdx === car.numStreets - 1) {
                        car.arrived = true;
                        car.score = dataset.simulation.bonusPoint + remainingTime;
                        car.commuteTime = time;
                        continue;
                    }

                    if (remainingTime === 0) {
                        continue;
                    }

                    const streetName = car.currentStreetName;
                    const { schedule, scheduledTimeWindow } = dataset.streets[streetName];
                    let isTrafficLightGreen = false;

                    if (schedule) {
                        const timePart = time % scheduledTimeWindow;

                        isTrafficLightGreen = schedule.gte <= timePart && schedule.lte >= timePart;
                    }

                    if (
                        !isTrafficLightGreen ||
                        isIntersectionCrossedInThisIteration[streetName] ||
                        dataset.streets[streetName].lastQueuingNumber + 1 !== car.queuingNumber
                    ) {
                        continue;
                    }

                    isIntersectionCrossedInThisIteration[streetName] = true;
                    dataset.streets[streetName].lastQueuingNumber = car.queuingNumber;

                    car.currentStreetName = car.streetNames[++car.currentStreetIdx];
                    car.remainingTimeOnStreet = dataset.streets[car.currentStreetName].duration;
                }
            }

            time++;
        }
    } catch (error) {
        ERROR_MESSAGE = "FAILED TO SIMULATE";
        error_status = true;
    }

}

let outputToFile = 0;

function createInsights() {

    if (error_status === false) {

        const toPercentage = value => `${(value * 100).toFixed(0)}%`;

        const { numIntersections, numCars, bonusPoint } = dataset.simulation;
        const arrivedCars = dataset.cars
            .filter(car => car.arrived)
            .sort((a, b) => a.commuteTime - b.commuteTime);

        const numArrivedCars = arrivedCars.length;
        const score = arrivedCars.reduce((sum, car) => sum + car.score, 0);
        const earlyArrivalBonus = arrivedCars.reduce((sum, car) =>
            sum + (car.score - bonusPoint), 0
        );
        const averageCommuteTime = (arrivedCars.reduce(
            (sum, car) => sum + car.commuteTime, 0
        ) / numArrivedCars).toFixed(2);


        // Push the result to the database

        // GET user data from localstorage

        let user = JSON.parse(localStorage.getItem("user"));

        let data = {
            "hash": uhash,
            "score": score,
            "user": user.email,
            "time": new Date().getTime(),
            "input": file1Input.files[0].name,
            "output": file2Input.files[0].name,
            "inputSize": file1Input.files[0].size,
            "outputSize": file2Input.files[0].size,
        };

        // Push to firestore database

        db.collection(`results`).doc(uhash).collection("data").add(data).then((docRef) => {
            console.log("Document written with ID: ", docRef.id);
        });

        // Push to Firestore database with a random document ID
        db.collection('user').doc(user.email).collection('results')
            .add(data)
            .then((docRef) => {
                console.log('Added data with random document ID to the user database', docRef.id);
            })
            .catch((error) => {
                console.error('Error adding data with random document ID to user database:', error);
            });
        // LOOP through all the results in DB and get the best score

        let bestScore = 0;
        let formattedChange = 0;
        let scoresArray = [];

        db.collection(`results`).doc(uhash).collection("data").orderBy('time', 'desc').get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                let data = doc.data();

                // Add this score to website

                let time = new Date(data.time).toLocaleString();

                let otherScore = calculateDifferenceInPercentage(score, data.score);
                scoresArray.push(data.score);

                if (otherScore > 0) {
                    otherScore = "+" + otherScore;
                }

                if (otherScore == 0) {
                    otherScore = "FAILED"
                }

                if (isNaN(otherScore)) {
                    otherScore = "FAILED"
                }

                if (!isFinite(otherScore)) {
                    otherScore = "SAME"
                }

                if (otherScore !== "SAME") {
                    otherScore = otherScore + "%";
                }

                if (otherScore == "SAME" && data.score == 0) {
                    otherScore = "FAILED"
                }

                if (otherScore == "SAME" && data.score == "FAILED") {
                    otherScore = "FAILED"
                    data.score = "Error"
                }

                let html = `<div class="sub">
            <span class="s">${otherScore} ${data.score} points</span>
            <span class="u">${data.user}</span>
            <span class="t">${time}</span>
            </div>`;

                document.getElementById("scores").innerHTML += html;

                // Add the best score to the database

                if (data.score > bestScore) {
                    bestScore = data.score;
                }

            });


            let userScore = score;


            // Calculate the change in score in %

            let change = ((userScore - bestScore) / bestScore) * 100;

            // Check if the change is positive or negative

            let changeType = change > 0 ? "positive" : "negative";

            // Check if the change is 0

            if (change === 0) {
                changeType = "neutral";
            }

            // Check if the change is NaN

            if (isNaN(change)) {
                changeType = "neutral";
            }

            // Check if the change is infinite

            if (!isFinite(change)) {
                changeType = "neutral";
            }


            // Format the change

            formattedChange = change.toFixed(2);

            // Check if the change is positive or negative

            if (changeType === "positive") {
                formattedChange = "+" + formattedChange;
            }

            // Check if the change is neutral

            if (changeType === "neutral") {
                formattedChange = "BEST SCORE";
            }

            // Check if the change is NaN

            if (isNaN(change)) {
                formattedChange = "BEST SCORE";
            }

            // Check if the change is infinite

            if (!isFinite(change)) {
                formattedChange = "BEST SCORE";
            }

            if (formattedChange !== "BEST SCORE") {
                formattedChange = formattedChange + "%";
            }




            const arrivedCarsInsights = [
                // `${numArrivedCars} of ${numCars}`,
                // `cars arrived before the deadline (${toPercentage(numArrivedCars / numCars)}).`,
            ];

            carsArr = numArrivedCars;
            carsAfter = numCars - numArrivedCars;

            if (arrivedCars.length) {
                arrivedCarsInsights.push(...[
                    `The fastest car reached its destination in ${arrivedCars[0].commuteTime}`,
                    `seconds earning ${arrivedCars[0].score} points. The slowest car took`,
                    `${arrivedCars[numArrivedCars - 1].commuteTime}`,
                    `seconds earning ${arrivedCars[numArrivedCars - 1].score} points.`,
                    `The average driving time for the cars that met the deadline was ${averageCommuteTime}`,
                    'seconds to arrive at their destination.',
                ]);

                if (bonusPoint) {
                    arrivedCarsInsights.push(...[
                        `The total bonus points awarded to the cars that met the deadline`,
                        `was ${earlyArrivalBonus} points.`,
                    ]);
                }

                if (numArrivedCars < numCars) {
                    const numLateCars = numCars - numArrivedCars;

                    // arrivedCarsInsights.push(...[
                    //     `${numLateCars} of ${numCars} cars arrived after the deadline`,
                    //     `(${toPercentage(numLateCars / numCars)}).`,
                    // ]);
                }


            }

            // If it has not failed, then create a chart



            let chart = document.getElementById("myChart");
            let ctx = chart.getContext('2d');
            let myChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ["Cars before Deadline", "Cars after Deadline"],
                    datasets: [{
                        label: ["# of Cars"],
                        data: [carsArr, carsAfter],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Cars before Deadline vs Cars after Deadline'
                        }
                    }
                }
            });

            // Create a chart for the score

            let allScores = new Set(scoresArray);

            // Remvoe the "FAILED" score

            allScores.delete("FAILED");

            let scoreChart = document.getElementById("myChart2");
            let scoreCtx = scoreChart.getContext('2d');
            let scoreChartChart = new Chart(scoreCtx, {
                type: 'bar',
                data: {
                    labels: [...allScores],
                    datasets: [{
                        label: "Scores",
                        data: [...allScores],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Scores'
                        }
                    }
                }
            });


            document.getElementById("result").innerHTML += `<h1 class="mini">The submited file has scored</h1> <span class="change">${formattedChange}</span> <span class="bigscore">${score} points</span><br><br>`;
            document.getElementById("result").innerHTML += arrivedCarsInsights.join(' ');
            document.getElementById("result").innerHTML += `<br><br>`;
        });




        document.getElementById("result").classList.remove("hidden");
        document.getElementById("info").classList.remove("hidden");
        document.getElementById("validation").classList.remove("hidden");
        document.getElementById("scores").classList.remove("hidden");





    } else {

        // Push the result to the database

        // GET user data from localstorage

        let user = JSON.parse(localStorage.getItem("user"));

        let data = {
            "hash": uhash,
            "score": "FAILED",
            "user": user.email,
            "time": new Date().getTime(),
            error: ERROR_MESSAGE,
        };

        // Push to firestore database

        db.collection(`results`).doc(uhash).collection("data").add(data).then((docRef) => {
            console.log("Document written with ID: ", docRef.id);
        });

        // Push to Firestore database with a random document ID
        db.collection('user').doc(user.email).collection('results')
            .add(data)
            .then((docRef) => {
                console.log('Added data with random document ID to the user database', docRef.id);
            })
            .catch((error) => {
                console.error('Error adding data with random document ID to user database:', error);
            });



        document.getElementById("result").innerHTML += `<h1 class="mini">The submited file has failed</h1> <span class="change">${ERROR_MESSAGE}</span> <span class="bigscore">0 points</span><br><br>`;
        document.getElementById("result").innerHTML += `<br><br>`;

        document.getElementById("result").classList.remove("hidden");
        document.getElementById("info").classList.remove("hidden");
        document.getElementById("validation").classList.remove("hidden");
        document.getElementById("scores").classList.remove("hidden");

    }
}


function downloadInsights() {
    let text = document.getElementById("info").innerText;
    let filename = "insights.txt";
    download(filename, text);
}

function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));

    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function calculateDifferenceInPercentage(a, b) {
    let difference = ((a - b) / b) * 100;
    return difference.toFixed(2);
}
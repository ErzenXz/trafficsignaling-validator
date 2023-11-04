function readTextFromFiles(file1, file2, callback) {
    const reader1 = new FileReader();
    const reader2 = new FileReader();

    // Read file1
    reader1.onload = function (event) {
        const text1 = event.target.result;

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

const file1Input = document.getElementById('file1'); // Assuming file input elements with IDs 'file1' and 'file2'
const file2Input = document.getElementById('file2');

let _text1, _text2;


file1Input.addEventListener('change', function (event) {
    const file1 = event.target.files[0];
    file2Input.addEventListener('change', function (event) {
        const file2 = event.target.files[0];
        readTextFromFiles(file1, file2, function (text1, text2) {
            if (text1 !== null && text2 !== null) {
                _text1 = text1;
                _text2 = text2;
                document.getElementById("btn").classList.remove("hidden");
            }
        });
    });
});




function validateData() {
    document.getElementById("loading").classList.remove("hidden");

    let input = _text1;
    let output = _text2;

    setTimeout(() => {
        parseInputDataSet(input);
        parseSubmittedDataSet(output);
        simulate();
        let score = createInsights();
        let r = new Set(results);

        results = [...r];

        let table = generateTable(results);

        document.getElementById("result").innerHTML = score;
        document.getElementById("result").classList.remove("hidden");
        document.getElementById("inputForm").classList.add("hidden");
        document.getElementById("info").innerHTML = table;
    }, 300);
}

function generateTable(dataArray) {
    let tableHTML = '<table>';
    tableHTML += '<thead><tr><th>Constraint</th><th>Result</th></tr></thead>';
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

function parseInputDataSet(data) {
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
    const lines = data.split('\n');
    const numIntersections = +lines.shift();
    const intersectionSchedulesById = {};
    let numSchedules = 0;
    let currentLine = 0;

    for (let i = 0; i < numIntersections; i++) {
        const intersectionId = lines[currentLine + i];
        const numIncomingStreets = lines[currentLine + i + 1];

        if (typeof numIncomingStreets === 'undefined') {
            results.push("Submission file has fewer lines than expected Error-Code:" + `Unexpected EOF (end of file) at line ${currentLine + i + 2}`);
            // throw new Error([
            //     'Submission file has fewer lines than expected',
            //     `Unexpected EOF (end of file) at line ${currentLine + i + 2}`,
            // ].join('. '));
        } else {
            results.push("Submission file has normal number of lines");
        }

        if (isNaN(numIncomingStreets)) {
            results.push(`Invalid number of elements found at line ${currentLine + i + 3} Error-Code:` + `Invalid number of elements found at line ${currentLine + i + 3}`);
            // throw new Error(
            //     `Invalid number of elements found at line ${currentLine + i + 3}`
            // );
        } else {
            results.push("Submission file has normal number of elements");
        }

        if (intersectionSchedulesById[intersectionId]) {
            results.push(`More than one adjustment was provided for intersection ${intersectionId}.` + `Error-Code: More than one adjustment was provided for intersection ${intersectionId}.`);
            // throw new Error(
            //     `More than one adjustment was provided for intersection ${intersectionId}.`
            // );
        } else {
            results.push("Submission file has normal number of adjustments");
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
                results.push("Submission file has normal street names");
            }

            if (isNaN(schedule)) {
                results.push("Submission file has invalid schedule " + `Error-Code: The schedule of street ${streetName} has a duration for green light that is not a number: ${schedule}.`);
                // throw new Error([
                //     `The schedule of street ${streetName} has a duration for green light`,
                //     `that is not a number: ${schedule}.`,
                // ].join(' '));
            } else {
                results.push("Submission file has normal schedule for green light");
            }


            if (schedule < 1 || schedule > dataset.simulation.duration) {
                results.push("Submission file has invalid schedule " + `Error-Code: The schedule of street ${streetName} should have duration for green light that is between 1 and ${dataset.simulation.duration}.`);
                // throw new Error([
                //     `The schedule of street ${streetName} should have duration`,
                //     `for green light that is between 1 and ${dataset.simulation.duration}.`,
                // ].join(' '));
            } else {
                results.push("Submission file has normal schedule for duration");
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
}


function simulate() {
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
}

let outputToFile = 0;

function createInsights() {
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

    const arrivedCarsInsights = [
        `${numArrivedCars} of ${numCars}`,
        `cars arrived before the deadline (${toPercentage(numArrivedCars / numCars)}).`,
    ];

    if (arrivedCars.length) {
        arrivedCarsInsights.push(...[
            `The earliest car arrived at its destination after ${arrivedCars[0].commuteTime}`,
            `seconds scoring ${arrivedCars[0].score} points, whereas the last`,
            `car arrived at its destination after ${arrivedCars[numArrivedCars - 1].commuteTime}`,
            `seconds scoring ${arrivedCars[numArrivedCars - 1].score} points.`,
            `Cars that arrived within the deadline drove for an average of ${averageCommuteTime}`,
            'seconds to arrive at their destination.',
        ]);

        if (bonusPoint) {
            arrivedCarsInsights.push(...[
                `The total bonus points earned by cars that arrived within the deadline`,
                `is ${earlyArrivalBonus} points.`,
            ]);
        }

        if (numArrivedCars < numCars) {
            const numLateCars = numCars - numArrivedCars;

            arrivedCarsInsights.push(...[
                `${numLateCars} of ${numCars} cars arrived after the deadline`,
                `(${toPercentage(numLateCars / numCars)}).`,
            ]);
        }


    }

    return [
        [
            `The submited file has scored <h1>${score} points</h1><br><br>`,
        ].join(' '),
        arrivedCarsInsights.join(' '),
        [
            '\n',
        ].join(' '),
    ].join('\n\n');
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


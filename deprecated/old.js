// Function to parse the input
function parseInput(input) {
    var lines = input.split("\n");
    var firstLine = lines[0].trim().split(" ");
    var duration = parseInt(firstLine[0]);
    var intersectionCount = parseInt(firstLine[1]);
    var streetCount = parseInt(firstLine[2]);
    var carCount = parseInt(firstLine[3]);
    var bonusPoints = parseInt(firstLine[4]);

    var streets = [];
    for (var i = 1; i <= streetCount; i++) {
        var streetLine = lines[i].trim().split(" ");
        var startIntersection = parseInt(streetLine[0]);
        var endIntersection = parseInt(streetLine[1]);
        var name = streetLine[2];
        var time = parseInt(streetLine[3]);
        streets.push({
            startIntersection: startIntersection,
            endIntersection: endIntersection,
            name: name,
            time: time
        });
    }

    var cars = [];
    for (var i = streetCount + 1; i <= streetCount + carCount; i++) {
        var carLine = lines[i].trim().split(" ");
        var streetCount = parseInt(carLine[0]);
        var path = [];
        for (var j = 1; j <= streetCount; j++) {
            path.push(carLine[j]);
        }
        cars.push({
            streetCount: streetCount,
            path: path
        });
    }

    return {
        duration: duration,
        intersectionCount: intersectionCount,
        streetCount: streetCount,
        carCount: carCount,
        bonusPoints: bonusPoints,
        streets: streets,
        cars: cars
    };
}

// Function to parse the output
function parseOutput(output) {
    var lines = output.split("\n");
    var scheduleCount = parseInt(lines[0].trim());
    var schedules = [];
    for (var i = 1; i <= scheduleCount; i++) {
        var intersectionId = parseInt(lines[i++].trim());
        var incomingStreetCount = parseInt(lines[i++].trim());
        var streetNames = [];
        var streetDurations = [];
        for (var j = 0; j < incomingStreetCount; j++) {
            var streetLine = lines[i++].trim().split(" ");
            streetNames.push(streetLine[0]);
            streetDurations.push(parseInt(streetLine[1]));
        }
        schedules.push({
            intersectionId: intersectionId,
            incomingStreetCount: incomingStreetCount,
            streetNames: streetNames,
            streetDurations: streetDurations
        });
    }

    return {
        scheduleCount: scheduleCount,
        schedules: schedules
    };
}
function calculateScore(input, output) {
    const { duration, intersectionCount, streetCount, carCount, bonusPoints, streets, cars } = parseInput(input);
    const schedules = Object.values(parseOutput(output));

    console.log(schedules);

    let score = 0;
    // for (let i = 0; i < cars.length; i++) {
    //     const car = cars[i];
    //     const path = car.path;
    //     let time = 0;
    //     let points = 0;
    //     for (let j = 0; j < path.length; j++) {
    //         const streetName = path[j];
    //         const street = streets.find(s => s.name === streetName);
    //         time += street.time;
    //         if (j === path.length - 1) {
    //             if (time <= duration) {
    //                 points += bonusPoints + (duration - time);
    //             }
    //         } else {
    //             const schedule = schedules.find(s => s.intersectionId === street.endIntersection);
    //             if (schedule) {
    //                 const duration = schedule.streetDurations[schedule.streetNames.indexOf(streetName)];
    //                 time += duration;
    //             }
    //         }
    //     }
    //     score += points;
    // }

    return score;
}


// // function parseTrafficSignalOutput(input) {
// //     const lines = input.split("\n"); // Split input by lines
// //     const numIntersections = parseInt(lines[0]); // Get number of intersections
// //     let currentIndex = 1; // Set current index to 1 to skip first line

// //     const trafficSignalSchedules = [];
// //     for (let i = 0; i < numIntersections; i++) {
// //         const intersectionId = parseInt(lines[currentIndex++]); // Get intersection ID
// //         const numIncomingStreets = parseInt(lines[currentIndex++]); // Get number of incoming streets for this intersection

// //         const streets = [];
// //         for (let j = 0; j < numIncomingStreets; j++) {
// //             const streetLine = lines[currentIndex++].split(" "); // Split incoming street line by space
// //             const streetName = streetLine[0]; // Get street name
// //             const duration = parseInt(streetLine[1]); // Get duration of green light
// //             streets.push({ streetName, duration }); // Push street name and duration to streets array
// //         }

// //         trafficSignalSchedules.push({
// //             intersectionId,
// //             streets,
// //         }); // Push intersection ID and streets to trafficSignalSchedules array
// //     }

// //     return trafficSignalSchedules;
// // }



/// //// / // / / / / / 


function calculateScore(input, output) {
    const parsedInput = input; // Parse input file
    const parsedOutput = output; // Parse output file
    const { D, cars } = parsedInput; // Extract relevant data from parsed input
    let score = 0; // Initialize score to 0

    for (let i = 0; i < cars.length; i++) {
        const car = cars[i]; // Get current car
        const carFinishTime = getCarFinishTime(parsedOutput, car); // Get finish time for current car
        if (carFinishTime <= D) {
            // If car finishes before deadline
            const carScore = parsedInput.F + (D - carFinishTime); // Calculate car score
            score += carScore; // Add car score to total score
        }
    }

    return score; // Return total score
}

function getCarFinishTime(trafficSignalSchedules, car) {
    try {
        if (!car.path || car.path.length === 0) {
            throw new Error("Car path is undefined or empty");
        }
        const path = car.path;
        console.log(path);
        const streets = trafficSignalSchedules[car.P].streets;
        let totalTime = 0;
        for (let i = 0; i < path.length; i++) {
            const street = path[i];
            if (streets[street]) {
                totalTime += streets[street].duration;
            } else {
                throw new Error(`Street '${street}' not found in traffic signal schedule for intersection '${car.P}'`);
            }
        }
        return totalTime;
    } catch (error) {
        console.error(error);
        return 0;
    }
}


function getIntersectionIdByName(streetName, trafficSignalSchedules) {
    for (const trafficSignal of trafficSignalSchedules) {
        const streets = trafficSignal.streets;
        for (const streetId in streets) {
            const street = streets[streetId];
            if (street.streetName === streetName) {
                return trafficSignal.intersectionId;
            }
        }
    }
    return -1;
}

// function parseTrafficSignalOutput(input) {


//     try {
//         const lines = input.split("\n"); // Split input by lines
//         const numIntersections = parseInt(lines[0]); // Get number of intersections
//         let currentIndex = 1; // Set current index to 1 to skip first line

//         const trafficSignalSchedules = [];
//         for (let i = 0; i < numIntersections; i++) {
//             const intersectionId = parseInt(lines[currentIndex++]); // Get intersection ID
//             const numIncomingStreets = parseInt(lines[currentIndex++]); // Get number of incoming streets for this intersection

//             const streets = [];
//             for (let j = 0; j < numIncomingStreets; j++) {
//                 const streetLine = lines[currentIndex++]; // Get incoming street line
//                 if (streetLine) {
//                     const streetParts = streetLine.split(" "); // Split incoming street line by space
//                     if (streetParts.length === 2) {
//                         const streetName = streetParts[0]; // Get street name
//                         const duration = parseInt(streetParts[1]); // Get duration of green light
//                         streets.push({ streetName, duration }); // Push street name and duration to streets array
//                     }
//                 }
//             }

//             trafficSignalSchedules.push({
//                 intersectionId,
//                 streets,
//             }); // Push intersection ID and streets to trafficSignalSchedules array
//         }


//         return trafficSignalSchedules;
//     } catch (error) {
//         document.getElementById("result").innerHTML = "Falied to read output data...";
//     }



// }



function generateValidationTable(input, output) {
    const inputObj = input;
    const outputObj = output;

    // Rule 1: Check if the duration of green light for each street is within the range [0, D] in input
    const rule1 = outputObj.every(schedule => {
        return schedule.streets.every(street => street.duration >= 0 && street.duration <= inputObj.D);
    }) ? "&#x2705;" : "&#x274C;";

    // Rule 2: Check if each traffic signal schedule in output has at least one street with a positive duration
    const rule2 = outputObj.every(schedule => {
        return schedule.streets.some(street => street.duration > 0);
    }) ? "&#x2705;" : "&#x274C;";

    // Rule 3: Check if each street in output is a valid incoming street for the corresponding intersection ID as per the input
    const rule3 = outputObj.every(schedule => {
        const intersectionId = schedule.intersectionId;
        const incomingStreets = inputObj.streets.filter(street => street.E === intersectionId);
        return schedule.streets.every(street => incomingStreets.some(incomingStreet => incomingStreet.name === street.streetName));
    }) ? "&#x2705;" : "&#x274C;";

    // Rule 4: Check if the total number of cars in output matches the number of cars V in input
    const totalCars = outputObj.reduce((acc, schedule) => acc + schedule.streets.length, 0);
    const rule4 = totalCars === inputObj.V ? "&#x2705;" : "&#x274C;";

    // Rule 5: Check if the paths of the cars in output are valid streets as per the input
    const rule5 = inputObj.cars.every(car => {
        return car.path.every(streetName => inputObj.streets.some(street => street.name === streetName));
    }) ? "&#x2705;" : "&#x274C;";

    // Rule 6: Check if each street appears at most once in the schedule
    const rule6 = outputObj.every(schedule => {
        const streetNames = schedule.streets.map(street => street.streetName);
        const uniqueStreetNames = [...new Set(streetNames)];
        return streetNames.length === uniqueStreetNames.length;
    }) ? "&#x2705;" : "&#x274C;";

    const rule7 = outputObj.every(schedule => {
        const streetSet = new Set();
        return schedule.streets.every(street => {
            if (streetSet.has(street.streetName)) {
                return false; // Street appears more than once
            } else {
                streetSet.add(street.streetName);
                return true;
            }
        });
    }) ? "&#x2705;" : "&#x274C;";


    // Generate HTML table
    return `
        <table>
            <thead>
            <tr>
                <th>Rule</th>
                <th>Constrain</th>
                <th>Result</th>
            </tr>
            </thead>

            <tbody>
            <tr>
                <td>Rule 1</td>
                <td>Duration of green light for each street is within the range [0, D] in input</td>
                <td>${rule1}</td>
            </tr>
            <tr>
                <td>Rule 2</td>
                <td>Each traffic signal schedule in output has at least one street with a positive duration</td>
                <td>${rule2}</td>
            </tr>
            <tr>
                <td>Rule 3</td>
                <td>Each street in output is a valid incoming street for the corresponding intersection ID as per the input</td>
                <td>${rule3}</td>
            </tr>
            <tr>
                <td>Rule 4</td>
                <td>Paths of the cars in output are valid streets as per the input</td>
                <td>${rule5}</td>
            </tr>
            <tr>
                <td>Rule 5</td>
                <td>Each street can appear at most once in the schedule</td>
                <td>${rule6}</td>
            </tr>
            <tr>
                <td>Rule 6</td>
                <td>Each street in output appears at most once in the schedule.</td>
                <td>${rule7}</td>
            </tr>
            </tbody>

        </table>
    `;

    let old = `            <tr>
    <td>Rule 4</td>
    <td>Total number of cars in output matches the number of cars V in input</td>
    <td>${rule4}</td>
</tr>`;
}


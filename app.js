


function validateData() {
    let input = _text1;
    let output = _text2;

    let inp = parseInputFile(input);
    let out = parseTrafficSignalOutput(output);

    let score = calculateScore(inp, out);
    let validationResults = generateValidationTable(inp, out);

    console.log(score);
    document.getElementById("result").innerHTML = score;
    document.getElementById("validation").innerHTML = validationResults;

    document.getElementById("inputForm").classList.add("hidden");

    let b = `
    <div class="row">
        <p>Duration of simulation: ${_D}</p>
        <p>Number of intersections: ${_I}</p>
        <p>Number of streets: ${_S}</p>
        <p>Number of cars: ${_V}</p>
        <p>Number of points for each car: ${_F}</p>
    </div>
    `;

    document.getElementById("info").innerHTML = b;
}


function parseTrafficSignalOutput(input) {


    try {
        const lines = input.split("\n"); // Split input by lines
        const numIntersections = parseInt(lines[0]); // Get number of intersections
        let currentIndex = 1; // Set current index to 1 to skip first line

        const trafficSignalSchedules = [];
        for (let i = 0; i < numIntersections; i++) {
            const intersectionId = parseInt(lines[currentIndex++]); // Get intersection ID
            const numIncomingStreets = parseInt(lines[currentIndex++]); // Get number of incoming streets for this intersection

            const streets = [];
            for (let j = 0; j < numIncomingStreets; j++) {
                const streetLine = lines[currentIndex++]; // Get incoming street line
                if (streetLine) {
                    const streetParts = streetLine.split(" "); // Split incoming street line by space
                    if (streetParts.length === 2) {
                        const streetName = streetParts[0]; // Get street name
                        const duration = parseInt(streetParts[1]); // Get duration of green light
                        streets.push({ streetName, duration }); // Push street name and duration to streets array
                    }
                }
            }

            trafficSignalSchedules.push({
                intersectionId,
                streets,
            }); // Push intersection ID and streets to trafficSignalSchedules array
        }


        return trafficSignalSchedules;
    } catch (error) {
        document.getElementById("result").innerHTML = "Falied to read output data...";
    }



}


let _D, _I, _S, _V, _F;


function parseInputFile(input) {


    try {

        const lines = input.trim().split("\n");
        const [D, I, S, V, F] = lines[0].split(" ").map(Number);
        const streets = [];
        const cars = [];

        for (let i = 1; i <= S; i++) {
            const [B, E, name, L] = lines[i].split(" ");
            streets.push({
                B: Number(B),
                E: Number(E),
                name,
                L: Number(L)
            });
        }

        for (let i = S + 1; i <= S + V; i++) {
            const [P, ...path] = lines[i].split(" ");
            cars.push({
                P: Number(P),
                path
            });
        }

        _D = D;
        _I = I;
        _S = S;
        _V = V;
        _F = F;

        return {
            D,
            I,
            S,
            V,
            F,
            streets,
            cars
        };

    } catch (error) {
        document.getElementById("result").innerHTML = "Falied to read input data...";

    }



}

// function calculateScore(input, output) {

//     try {
//         const D = input.D; // deadline
//         let totalScore = 0; // initialize total score

//         for (const car of input.cars) {
//             let carScore = 0; // initialize score for each car
//             let currentTime = 0; // initialize current time to 0

//             for (const streetName of car.path) {
//                 const street = input.streets.find(s => s.name === streetName); // find the street object from input data
//                 const trafficSignal = output.find(ts => ts.intersectionId === street.E); // find the traffic signal schedule for the current intersection from output data
//                 const duration = trafficSignal.streets.find(s => s.streetName === street.name)?.duration; // find the duration of green light for the current street from traffic signal schedule

//                 if (duration !== undefined) {
//                     // if duration is defined (i.e., there is a traffic signal schedule for the current street)
//                     currentTime += street.L; // add street length to current time
//                     if (currentTime <= D) {
//                         // if current time is less than or equal to deadline
//                         carScore += D - currentTime + input.F; // add awarded score for finishing the path to carScore
//                     }
//                     currentTime += duration; // add duration of green light to current time
//                 }
//             }

//             totalScore += Math.max(0, carScore); // add carScore to totalScore, but ensure it's not negative (minimum score is 0)
//         }

//         return "The calculated score is " + totalScore;
//     } catch (error) {
//         return "Failed to calculate score. ";
//     }



// }


function calculateScore(input, output) {
    try {
        const D = input.D; // deadline
        let totalScore = 0; // initialize total score

        for (const car of input.cars) {
            let carScore = 0; // initialize score for each car
            let currentTime = 0; // initialize current time to 0

            for (const streetName of car.path) {
                const street = input.streets.find(s => s.name === streetName); // find the street object from input data
                const trafficSignal = output.find(ts => ts.intersectionId === street.E); // find the traffic signal schedule for the current intersection from output data
                const duration = trafficSignal.streets.find(s => s.streetName === street.name)?.duration; // find the duration of green light for the current street from traffic signal schedule

                if (duration !== undefined) {
                    // if duration is defined (i.e., there is a traffic signal schedule for the current street)
                    currentTime += street.L; // add street length to current time
                    if (currentTime <= D) {
                        // if current time is less than or equal to deadline
                        carScore += D - currentTime + input.F; // add awarded score for finishing the path to carScore
                    }
                    currentTime += duration; // add duration of green light to current time
                }

                if (currentTime > D) {
                    // if current time exceeds deadline, break out of the loop
                    break;
                }
            }

            totalScore += Math.max(0, carScore); // add carScore to totalScore, but ensure it's not negative (minimum score is 0)
        }

        return "The calculated score is " + totalScore;
    } catch (error) {
        return "Failed to calculate score. ";
    }
}


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

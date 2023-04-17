


function validateData() {
    let input = _text1;
    let output = _text2;

    let inp = parseInputFile(input);
    let out = parseOutput(output);

    let score = calculateScore(out, inp.F, inp.D);
    let validationResults = validateOutputFile(output, input);

    console.log(score);
    document.getElementById("result").innerHTML = "The calculated score is: " + score;
    document.getElementById("validation").innerHTML = createValidationTable(validationResults);
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

    simulateTraffic(input, output);
}


function parseOutput(output) {
    const lines = output.trim().split("\n");
    const numIntersections = parseInt(lines[0]);
    const intersections = {};

    let i = 1;
    while (i < lines.length) {
        const intersectionId = parseInt(lines[i]);
        const numIncomingStreets = parseInt(lines[i + 1]);
        const incomingStreets = [];
        for (let j = 0; j < numIncomingStreets; j++) {
            const incomingStreetParts = lines[i + 2 + j].split(" ");
            const streetName = incomingStreetParts[0];
            const greenDuration = parseInt(incomingStreetParts[1]);
            incomingStreets.push({ streetName, greenDuration });
        }
        intersections[intersectionId] = incomingStreets;
        i += 2 + numIncomingStreets;
    }

    return { numIntersections, intersections };
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

function calculateScore(output, F, D) {
    const { numIntersections, intersections } = output;

    let score = 0;
    for (const intersectionId in intersections) {
        const incomingStreets = intersections[intersectionId];
        for (const incomingStreet of incomingStreets) {
            const { greenDuration } = incomingStreet;
            const finishTime = parseInt(intersectionId) + greenDuration; // Update this line
            if (finishTime <= D) {
                score += F + (D - finishTime);
            }
        }
    }

    return score;
}



function validateOutputFile(output, input) {
    const { numIntersections, intersections } = parseOutput(output);
    const { D, I, S, V, F, streets, cars } = parseInputFile(input);
    const validationTable = [];

    // Rule 1: Number of intersections matches input
    const rule1 = (numIntersections === I);
    validationTable.push({ rule: "Number of intersections matches input", check: rule1 ? "✅" : "❌" });

    // Rule 2: All intersection IDs are valid
    let rule2 = true;
    for (let intersectionId of Object.keys(intersections)) {
        if (isNaN(parseInt(intersectionId)) || parseInt(intersectionId) < 0 || parseInt(intersectionId) >= I) {
            rule2 = false;
            break;
        }
    }
    validationTable.push({ rule: "All intersection IDs are valid", check: rule2 ? "✅" : "❌" });

    // Rule 3: All incoming streets for each intersection are valid
    let rule3 = true;
    for (let intersectionId in intersections) {
        const incomingStreets = intersections[intersectionId];
        for (let incomingStreet of incomingStreets) {
            const streetName = incomingStreet.streetName;
            const greenDuration = incomingStreet.greenDuration;
            if (!streets.some(street => street.name === streetName && street.E === parseInt(intersectionId))) {
                rule3 = false;
                break;
            }
        }
    }
    validationTable.push({ rule: "All incoming streets for each intersection are valid", check: rule3 ? "✅" : "❌" });

    // Rule 4: All streets used in the cars' paths are valid
    let rule4 = true;
    for (let car of cars) {
        for (let streetName of car.path) {
            if (!streets.some(street => street.name === streetName)) {
                rule4 = false;
                break;
            }
        }
    }
    validationTable.push({ rule: "All streets used in the cars' paths are valid", check: rule4 ? "✅" : "❌" });

    // Rule 5: All green durations are valid
    let rule5 = true;
    for (let intersectionId in intersections) {
        const incomingStreets = intersections[intersectionId];
        for (let incomingStreet of incomingStreets) {
            const greenDuration = incomingStreet.greenDuration;
            if (isNaN(greenDuration) || greenDuration < 1) {
                rule5 = false;
                break;
            }
        }
    }
    validationTable.push({ rule: "All green durations are valid", check: rule5 ? "✅" : "❌" });

    // Rule 6: Sum of green durations for each intersection does not exceed duration D
    let rule6 = true;
    for (let intersectionId in intersections) {
        const incomingStreets = intersections[intersectionId];
        let sumGreenDurations = 0;
        for (let incomingStreet of incomingStreets) {
            const greenDuration = incomingStreet.greenDuration;
            sumGreenDurations += greenDuration;
        }
        if (sumGreenDurations > D) {
            rule6 = false;
            break;
        }
    }
    validationTable.push({ rule: "Sum of green durations for each intersection does not exceed duration D", check: rule6 ? "✅" : "❌" });

    // // Rule 7: All streets are used at most once in the cars' paths
    // let rule7 = true;
    // const usedStreets = new Set();
    // for (let car of cars) {
    //     for (let streetName of car.path) {
    //         if (usedStreets.has(streetName)) {
    //             rule7 = false;
    //             break;
    //         } else {
    //             usedStreets.add(streetName);
    //         }
    //     }
    // }
    // validationTable.push({ rule: "All streets are used at most once in the cars' paths", check: rule7 ? "✅" : "❌" });


    // // Rule 8: All cars start at the beginning of a street
    // let rule8 = true;
    // for (let car of cars) {
    //     const startStreet = car.path[0];
    //     if (!streets.some(street => street.name === startStreet && street.B === car.startIntersection)) {
    //         rule8 = false;
    //         break;
    //     }
    // }
    // validationTable.push({ rule: "All cars start at the beginning of a street", check: rule8 ? "✅" : "❌" });

    // Rule 9: All cars reach their destinations within the simulation duration D
    let rule9 = true;
    for (let car of cars) {
        const carDuration = car.path.reduce((totalDuration, streetName) => {
            const street = streets.find(street => street.name === streetName);
            return totalDuration + street.L;
        }, 0);
        if (carDuration > D + car.path.length - 1) { // Modified to account for waiting time at intersections
            rule9 = false;
            break;
        }
    }
    validationTable.push({ rule: "All cars reach their destinations within the simulation duration D", check: rule9 ? "✅" : "❌" });


    let rule10 = checkRule10(output);
    validationTable.push({ rule: "Each street can appear at most once in the schedule", check: rule10 ? "✅" : "❌" });


    return validationTable;


}


function createValidationTable(rules) {
    let table = '<table>';
    table += '<tr><th>Constrain</th><th>Result</th></tr>';

    for (let rule of rules) {
        table += '<tr>';
        table += '<td>' + rule.rule + '</td>';
        table += '<td>' + rule.check + '</td>';
        table += '</tr>';
    }

    table += '</table>';
    return table;
}


function checkRule10(output) {
    const parsedOutput = parseOutput(output);
    const intersections = parsedOutput.intersections;
    const streetOccurrences = new Map();
    for (const intersectionId in intersections) {
        const incomingStreets = intersections[intersectionId];
        for (const street of incomingStreets) {
            const streetName = street.streetName;
            if (streetOccurrences.has(streetName)) {
                streetOccurrences.set(streetName, streetOccurrences.get(streetName) + 1);
            } else {
                streetOccurrences.set(streetName, 1);
            }
        }
    }
    const rule10 = [...streetOccurrences.values()].every(count => count <= 1);
    return rule10;
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
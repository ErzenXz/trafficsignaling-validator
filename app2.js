

// Function to parse the input file

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

// Function to parse the output

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

function calculateScore(input, output) {
    const { D, cars } = parseInputFile(input);
    const { numIntersections, intersections } = parseOutput(output);

    let score = 0;
    for (const car of cars) {
        let currentTime = 0;
        for (const streetName of car.path) {
            const incomingStreets = intersections[car.P].filter(street => street.streetName === streetName);
            if (incomingStreets.length > 0) {
                const greenDuration = incomingStreets[0].greenDuration;
                if (currentTime + greenDuration <= D) {
                    currentTime += greenDuration;
                } else {
                    currentTime = D;
                }
            } else {
                currentTime = D;
            }
        }

        const timeLeft = D - currentTime;
        if (timeLeft > 0) {
            score += timeLeft + car.P;
        }
    }

    return score;
}


let db = firebase.firestore();

// Get the user from local storage
var user = JSON.parse(localStorage.getItem("user"));

// Get the data from firestore and display it

// Reference to the "results" subcollection
const resultsCollection = db.collection('user').doc(user.email).collection('results');

// Get all documents from the "results" subcollection
resultsCollection.orderBy('time', 'desc').get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        // doc.data() is the data within each document 
        console.log(doc.id, " => ", doc.data());
        var data = doc.data();
        let time = time_ago(data.time);

        let score = data.score;
        if (score == "FAILED") {
            score = `<span style="color: red;">FAILED</span>`;
        } else {
            score = `<span style="color: green;">Score: ${score}</span>`;
        }

        var html = `
        <div class="card" title="HASH: ${data.hash}\nInput File: ${data.input}\nOutput File: ${data.output}\nTime: ${time}\n\nScore: ${data.score}">
                
            <div class="card-inside">
            <h3 class="card-title">Instance: ${data.input}</h3>
            <h3 class="card-title">Solution: ${data.output}</h3>
            </div>
            <div class="card-inside">
                <strong>${score}</strong>
                <p>Validation Time: ${time}</p>
                </div>
        </div>
        `;
        document.getElementById("mySubmissions").innerHTML += html;
    });
}).catch((error) => {
    console.error('Error getting documents: ', error);
});

function time_ago(time) {

    switch (typeof time) {
        case 'number':
            break;
        case 'string':
            time = +new Date(time);
            break;
        case 'object':
            if (time.constructor === Date) time = time.getTime();
            break;
        default:
            time = +new Date();
    }
    var time_formats = [
        [60, 'seconds', 1], // 60
        [120, '1 minute ago', '1 minute from now'], // 60*2
        [3600, 'minutes', 60], // 60*60, 60
        [7200, '1 hour ago', '1 hour from now'], // 60*60*2
        [86400, 'hours', 3600], // 60*60*24, 60*60
        [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
        [604800, 'days', 86400], // 60*60*24*7, 60*60*24
        [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
        [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
        [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
        [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
        [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    var seconds = (+new Date() - time) / 1000,
        token = 'ago',
        list_choice = 1;

    if (seconds == 0) {
        return 'Just now'
    }
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }
    var i = 0,
        format;
    while (format = time_formats[i++])
        if (seconds < format[0]) {
            if (typeof format[2] == 'string')
                return format[list_choice];
            else
                return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
        }
    return time;
}
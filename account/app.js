firebase.auth().useDeviceLanguage();


firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/v8/firebase.User
        console.log("User is logged in!");
        // window.location.href = location.origin;
        // ...
    } else {
        // User is signed out
        // ...
        console.log("User is not logged in!");
    }
});

const forms = document.querySelector(".forms"),
    pwShowHide = document.querySelectorAll(".eye-icon"),
    links = document.querySelectorAll(".link");

pwShowHide.forEach(eyeIcon => {
    eyeIcon.addEventListener("click", () => {
        let pwFields = eyeIcon.parentElement.parentElement.querySelectorAll(".password");

        pwFields.forEach(password => {
            if (password.type === "password") {
                password.type = "text";
                eyeIcon.classList.replace("bx-hide", "bx-show");
                return;
            }
            password.type = "password";
            eyeIcon.classList.replace("bx-show", "bx-hide");
        })

    })
})

links.forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault(); //preventing form submit
        forms.classList.toggle("show-signup");
    })
})



async function login() {

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if (email == "") {
        toast("Please enter the email address");
        return;
    }
    if (password == "") {
        toast("Please enter a password");
        return;
    }

    toast("Please wait...", 3000);


    let userIP = await fetch('https://api.ipify.org?format=json').then(response => response.json()).then(data => data.ip);

    if (userIP == null) {
        userIP = await fetch('https://api.bigdatacloud.net/data/client-ip').then(response => response.json()).then(data => data.ip);
        if (userIP == null) {
            userIP = "Unknown IP";
        }
    }

    firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(() => {

            // Get the user data from the database
            let uid = firebase.auth().currentUser.uid;
            firebase.firestore().collection("users").doc(uid).get().then(async (doc) => {
                if (doc.exists) {
                    let userData = doc.data();

                    // Get the time into Firebase Timestamp format
                    let updatedLastSignInTime = firebase.firestore.Timestamp.fromDate(new Date());

                    let loginHistory = {
                        userIP: userIP,
                        loginTime: updatedLastSignInTime,
                        status: "Success"
                    };

                    let updatedLoginHistoryArray = userData.loginHistoryArray;
                    updatedLoginHistoryArray.push(loginHistory);

                    // If the user has not verified their email, send the verification email

                    // Get the data from authentication

                    let userA = firebase.auth().currentUser;
                    let emailVerified = userA.emailVerified;

                    if (!emailVerified) {
                        firebase.auth().currentUser.sendEmailVerification().then(function () {
                            // Email sent.
                            toast("Verification email has been sent to your email!", 3000);
                        }).catch(function (error) {
                            // An error happened.
                            toast("Error sending verification email!", 3000);
                        });
                    } else {
                        emailVerified = true;
                    }


                    // Update the last sign in time
                    firebase.firestore().collection("users").doc(uid).update({
                        lastSignInTime: updatedLastSignInTime,
                        loginHistoryArray: updatedLoginHistoryArray,
                        loginHistory: loginHistory,
                        emailVerified: emailVerified
                    }).then(() => {
                        console.log("Last sign in time updated!");
                        localStorage.setItem("user", JSON.stringify(userData));
                        toast("Login successful! ", 3000);
                        setTimeout(() => {
                            window.location.href = location.origin;
                        }, 500);
                    }).catch((error) => {
                        console.error("Error updating last sign in time: ", error);
                        localStorage.setItem("user", JSON.stringify(userData));
                        setTimeout(() => {
                            window.location.href = location.origin;
                        }, 500);
                    });

                } else {
                    // doc.data() will be undefined in this case
                    toast("User not found!", 3000);

                    // Delete the user from the authentication
                    firebase.auth().currentUser.delete().then(function () {
                        // User deleted.
                        toast("User deleted - Please create a new account!", 3000);
                    }).catch(function (error) {
                        // An error happened.
                        toast("Error deleting user!", 3000);
                    });
                }
            }).catch((error) => {
                toast("Error getting document:", error);
            });
        })
        .catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            toast(errorMessage, 8000);
            console.log(error);
        });

}


// Function to signup using email and password in Firebase Authentication

async function signup() {


    let email = document.getElementById("email-r").value;
    let password = document.getElementById("password-r").value;
    let password2 = document.getElementById("password-2r").value;

    let fullName = document.getElementById("name").value;

    let username = document.getElementById("username").value;

    if (email == "") {
        toast("Please enter an email address");
        return;
    }
    if (password == "") {
        toast("Please enter an password");
        return;
    }
    if (password2 == "") {
        toast("Please enter the second password");
        return;
    }
    if (password != password2) {
        toast("Passwords do not match");
        return;
    }

    if (fullName == "") {
        toast("Please enter your full name");
        return;
    }

    if (username == "") {
        toast("Please enter a username");
        return;
    }

    // Make sure the username is not taken
    let usernameTaken = false;
    await firebase.firestore().collection("users").where("username", "==", username).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            usernameTaken = true;
        }
        );
    });

    if (usernameTaken) {
        toast("Username already taken!");
        return;
    }

    // Make sure the username is formatted correctly
    if (username.length < 3) {
        toast("Username must be at least 3 characters long!");
        return;
    }

    if (username.length > 20) {
        toast("Username must be less than 20 characters long!");
        return;
    }

    if (username.includes(" ")) {
        toast("Username cannot contain spaces!");
        return;
    }

    if (username.includes(".")) {
        toast("Username cannot contain periods!");
        return;
    }

    if (username.includes("#") || username.includes("$") || username.includes("[") || username.includes("]")) {
        toast("Username cannot contain the characters #, $, [, or ]!");
        return;
    }

    if (username.includes("@")) {
        toast("Username cannot contain the @ symbol!");
        return;
    }

    // Remove all special characters from the username

    username = username.replace(/[^a-zA-Z0-9]/g, "");

    toast("Please wait...", 3000);

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            // Signed in 
            // Add the user to the database
            let user = userCredential.user;
            let uid = user.uid;
            let email = user.email;
            let photoURL = user.photoURL;
            let displayName = user.displayName;
            let phoneNumber = user.phoneNumber;
            let providerId = user.providerId;
            let emailVerified = user.emailVerified;
            let creationTime = user.metadata.creationTime;
            let lastSignInTime = user.metadata.lastSignInTime;

            let userIP = await fetch('https://api.ipify.org?format=json').then(response => response.json()).then(data => data.ip);

            if (userIP == null) {
                userIP = await fetch('https://api.bigdatacloud.net/data/client-ip').then(response => response.json()).then(data => data.ip);
                if (userIP == null) {
                    userIP = "Unknown IP";
                }
            }

            let userAgent = navigator.userAgent;
            let userBrowser = navigator.appName;
            let userOS = navigator.platform;
            let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let userLanguage = navigator.language;
            let userCountry = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let userSubdomain = getSubdomain(window.location.hostname);
            let userDomain = window.location.hostname;
            let userURL = window.location.href;
            let userReferrer = document.referrer;
            let userScreenResolution = window.screen.width + "x" + window.screen.height;
            let userScreenColorDepth = window.screen.colorDepth;
            let userScreenPixelDepth = window.screen.pixelDepth;
            let userCookiesEnabled = navigator.cookieEnabled;
            let userLocalStorageEnabled = typeof (Storage) !== "undefined";
            let userSessionStorageEnabled = typeof (sessionStorage) !== "undefined";
            let userDoNotTrack = navigator.doNotTrack;
            let userAdBlockEnabled = false;


            let browserInformation = {
                userAgent,
                userBrowser,
                userOS,
                userTimezone,
                userLanguage,
                userCountry,
                userSubdomain,
                userDomain,
                userURL,
                userReferrer,
                userScreenResolution,
                userScreenColorDepth,
                userScreenPixelDepth,
                userCookiesEnabled,
                userLocalStorageEnabled,
                userSessionStorageEnabled,
                userDoNotTrack,
                userAdBlockEnabled
            };

            let loginHistory = {
                userIP,
                loginTime: firebase.firestore.Timestamp.fromDate(new Date()),
                status: "Success"
            };

            let loginHistoryArray = [];

            let userData = {
                uid,
                email,
                photoURL,
                displayName,
                phoneNumber,
                providerId,
                emailVerified,
                creationTime,
                lastSignInTime,
                fullName,
                username,
                userIP,
                browserInformation,
                loginHistory,
                loginHistoryArray
            };


            // Send the verification email
            user.sendEmailVerification().then(function () {
                // Email sent.
                toast("Verification email has been sent to your email!", 3000);
            }).catch(function (error) {
                // An error happened.
                toast("Error sending verification email!", 3000);
            });

            loginHistoryArray.push(loginHistory);


            await firebase.firestore().collection("users").doc(uid).set(userData).then(() => {
                // Save the user data in the local storage
                localStorage.setItem("user", JSON.stringify(userData));

                toast("Signup successful! ", 3000);

                setTimeout(() => {
                    window.location.href = location.origin;
                }, 100);
            }).catch((error) => {
                console.error("Error while creating account: ", error);
            });

        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            toast(errorMessage, 8000);
        });

}

// Function to extract the subdomain from the URL
function getSubdomain(url) {
    const parts = url.split('.');
    return `${parts[0]}.${parts[1]}`;
}

function toast(message, duration = 4500, delay = 0) {

    // Check for existing toast class elements

    const existingToast = document.querySelector('.toast');

    if (existingToast) {
        existingToast.remove();
    }


    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '1rem';
    toastContainer.style.right = '1rem';
    toastContainer.style.display = 'flex';
    toastContainer.style.alignItems = 'center';
    toastContainer.style.justifyContent = 'center';
    toastContainer.style.width = '16rem';
    toastContainer.style.padding = '1rem';
    toastContainer.style.backgroundColor = '#1F2937';
    toastContainer.style.color = '#FFF';
    toastContainer.style.borderRadius = '0.25rem';
    toastContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25)';
    toastContainer.style.overflow = 'auto';
    toastContainer.style.maxHeight = '500px';
    toastContainer.style.minWidth = '200px';
    toastContainer.style.width = 'fit-content';
    toastContainer.style.zIndex = '9999';
    toastContainer.setAttribute('class', 'toast');

    const toastText = document.createElement('span');
    toastText.style.whiteSpace = 'nowrap';
    toastText.style.overflow = 'hidden';
    toastText.style.textOverflow = 'ellipsis';
    toastText.textContent = message;
    toastContainer.appendChild(toastText);

    document.body.appendChild(toastContainer);

    setTimeout(() => {
        toastContainer.style.opacity = '0';
        setTimeout(() => {
            toastContainer.remove();
        }, 300);
    }, duration + delay);

    toast.dismiss = function () {
        toastContainer.style.opacity = '0';
        setTimeout(() => {
            toastContainer.remove();
        }, 300);
    };
}



function forgotPassword() {
    let email = document.getElementById("email").value;

    if (email == "") {
        toast("Please enter an email address");
        return;
    }

    // ANTIBOT with prompt

    let a = Math.floor(Math.random() * 10);
    let b = Math.floor(Math.random() * 10);
    let promptAnswer = prompt(`Please enter the answer to the following question: What is ${a} + ${b}?`);

    let answer = a + b;

    if (promptAnswer != answer) {
        toast("Incorrect answer!");
        return;
    }

    firebase.auth().sendPasswordResetEmail(email).then(function () {
        // Email sent.
        toast("Password reset email sent!", 3000);
    }).catch(function (error) {
        // An error happened.
        toast("Error sending password reset email!", 3000);
    });
}
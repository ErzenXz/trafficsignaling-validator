const body = document.querySelector("body");
const darkLight = document.querySelector("#darkLight");
const sidebar = document.querySelector(".sidebar");
const submenuItems = document.querySelectorAll(".submenu_item");
const sidebarOpen = document.querySelector("#sidebarOpen");
const sidebarClose = document.querySelector(".collapse_sidebar");
const sidebarExpand = document.querySelector(".expand_sidebar");
sidebarOpen.addEventListener("click", () => sidebar.classList.toggle("close"));

sidebarClose.addEventListener("click", () => {

    // Save the state of the sidebar
    localStorage.setItem("sidebar", "close");

    sidebar.classList.add("close", "hoverable");

    document.getElementById("mainD").style.marginLeft = "50px";
});
sidebarExpand.addEventListener("click", () => {

    // Save the state of the sidebar
    localStorage.setItem("sidebar", "open");
    sidebar.classList.remove("close", "hoverable");
    document.getElementById("mainD").style.marginLeft = "250px";
});

sidebar.addEventListener("mouseenter", () => {
    if (sidebar.classList.contains("hoverable")) {
        sidebar.classList.remove("close");
        document.getElementById("mainD").style.marginLeft = "250px";
    }
});
sidebar.addEventListener("mouseleave", () => {
    if (sidebar.classList.contains("hoverable")) {
        sidebar.classList.add("close");
        document.getElementById("mainD").style.marginLeft = "50px";
    }
});

darkLight.addEventListener("click", () => {
    body.classList.toggle("dark");
    if (body.classList.contains("dark")) {
        // document.setI
        localStorage.setItem("dark", "true");
        darkLight.classList.replace("bx-sun", "bx-moon");
    } else {
        localStorage.setItem("dark", "false");
        darkLight.classList.replace("bx-moon", "bx-sun");
    }
});

submenuItems.forEach((item, index) => {
    item.addEventListener("click", () => {
        item.classList.toggle("show_submenu");
        submenuItems.forEach((item2, index2) => {
            if (index !== index2) {
                item2.classList.remove("show_submenu");
            }
        });
    });
});

if (window.innerWidth < 768) {
    sidebar.classList.add("close");
} else {
    sidebar.classList.remove("close");
}

// Check if the user has a dark theme

if (localStorage.getItem("dark") === "true") {
    body.classList.add("dark");
    darkLight.classList.replace("bx-sun", "bx-moon");
}


// Check if the side bar is open or close

if (localStorage.getItem("sidebar") === "close") {
    sidebar.classList.add("close");
    document.getElementById("mainD").style.marginLeft = "50px";
}

// Add event listener when the logOutB is clicked, log the user out using firebase

document.getElementById("logOutB").addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
    }).catch((error) => {
        // An error happened.
    });
});

// Check if the user is logged in

firebase.auth().useDeviceLanguage();

// Authentication check

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/v8/firebase.User
        console.log("User is logged in!");
        var uid = user.uid;
        let email = user.email;

        let userImage = user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";

        document.getElementById("emailUser").innerHTML = email;
        document.getElementById("ImageUser").src = userImage;
        // ...
    } else {
        // User is signed out
        // ...
        console.log("User is not logged in!");
        location.href = "/account/";
    }
});

// Event listener when the user screen size is less than 768px

window.addEventListener("resize", () => {
    if (window.innerWidth < 768) {
        sidebar.classList.add("close");
    } else {
        sidebar.classList.remove("close");
    }
});
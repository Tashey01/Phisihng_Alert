const parameters =
    new URLSearchParams(
        window.location.search
    );


const destination =
    parameters.get("url");


const warningData =
    parameters.get("warnings");


let warnings = [];


try {

    warnings =
        JSON.parse(warningData);

}

catch (error) {

    warnings = [
        "A suspicious URL characteristic was detected."
    ];
}


// Display destination

document.getElementById(
    "destination"
).textContent = destination;


// Display warnings

const warningList =
    document.getElementById(
        "warning-list"
    );


warnings.forEach(function(warning) {

    const item =
        document.createElement("li");

    item.textContent =
        warning;

    warningList.appendChild(item);

});


// GO BACK

document.getElementById(
    "backButton"
).addEventListener(
    "click",
    function() {

        history.back();

    }
);


// CONTINUE

document.getElementById(
    "continueButton"
).addEventListener(
    "click",
    function() {

        window.location.href =
            destination;

    }
);
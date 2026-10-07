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

    warnings = [{
        rule: "Unknown",
        title: "URL warning",
        message:
            "A potentially suspicious URL characteristic was detected."
    }];
}


// =====================================================
// DISPLAY DESTINATION
// =====================================================

document.getElementById(
    "destination"
).textContent =
    destination;


// =====================================================
// DISPLAY WARNINGS
// =====================================================

const warningList =
    document.getElementById(
        "warning-list"
    );


warnings.forEach(function(warning) {

    const item =
        document.createElement("li");


    const heading =
        document.createElement("strong");


    heading.textContent =
        `${warning.rule} — ${warning.title}`;


    const explanation =
        document.createElement("div");


    explanation.textContent =
        warning.message;


    item.appendChild(
        heading
    );


    item.appendChild(
        explanation
    );


    warningList.appendChild(
        item
    );
});


// =====================================================
// GO BACK
// =====================================================

document.getElementById(
    "backButton"
).addEventListener(
    "click",
    function() {

        history.back();

    }
);


// =====================================================
// CONTINUE ANYWAY
// =====================================================

document.getElementById(
    "continueButton"
).addEventListener(
    "click",
    async function() {

        try {

            await chrome.runtime.sendMessage({
                type: "ALLOW_ONCE",
                url: destination
            });


            window.location.href =
                destination;

        }

        catch (error) {

            console.error(
                "Could not continue:",
                error
            );
        }
    }
);
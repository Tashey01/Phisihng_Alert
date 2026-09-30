const KNOWN_BRANDS = {
    google: ["google.com"],
    microsoft: ["microsoft.com", "microsoftonline.com"],
    paypal: ["paypal.com"],
    apple: ["apple.com"]
};


// -------------------------
// Rule 1: IP address
// -------------------------

function isIPAddress(hostname) {

    const ipv4Pattern =
        /^(\d{1,3}\.){3}\d{1,3}$/;

    return ipv4Pattern.test(hostname);
}


// -------------------------
// Rule 2: Many domain parts
// -------------------------

function hasManyDomainParts(hostname) {

    const parts = hostname.split(".");

    return parts.length > 4;
}


// -------------------------
// Rule 3: Brand mismatch
// -------------------------

function checkBrandMismatch(hostname) {

    const warnings = [];

    for (const brand in KNOWN_BRANDS) {

        if (hostname.includes(brand)) {

            const officialDomains =
                KNOWN_BRANDS[brand];

            const legitimate =
                officialDomains.some(domain =>
                    hostname === domain ||
                    hostname.endsWith("." + domain)
                );

            if (!legitimate) {

                warnings.push(
                    `The URL contains the trusted-looking word ` +
                    `'${brand}', but the hostname is not one of ` +
                    `the expected ${brand} domains.`
                );
            }
        }
    }

    return warnings;
}


// -------------------------
// Analyse URL
// -------------------------

function analyseURL(urlString) {

    const warnings = [];

    try {

        const url = new URL(urlString);
        const hostname =
            url.hostname.toLowerCase();


        // Rule 1
        if (isIPAddress(hostname)) {

            warnings.push(
                "The URL uses an IP address instead of a normal domain name."
            );
        }


        // Rule 2
        if (hasManyDomainParts(hostname)) {

            warnings.push(
                "The URL contains several domain components. " +
                "Check the actual domain carefully."
            );
        }


        // Rule 3
        warnings.push(
            ...checkBrandMismatch(hostname)
        );


        // Rule 4
        if (urlString.includes("@")) {

            warnings.push(
                "The URL contains an '@' character, " +
                "which can make the destination difficult to interpret."
            );
        }

    }

    catch (error) {

        console.log(
            "Could not analyse URL:",
            urlString
        );
    }

    return warnings;
}


// -------------------------
// Watch browser navigation
// -------------------------

chrome.webNavigation.onBeforeNavigate.addListener(
    function(details) {

        // Only analyse the main browser page
        if (details.frameId !== 0) {
            return;
        }


        // Ignore Chrome internal pages
        if (
            details.url.startsWith("chrome://") ||
            details.url.startsWith("chrome-extension://")
        ) {
            return;
        }


        const warnings =
            analyseURL(details.url);


        if (warnings.length > 0) {

            const warningPage =
                chrome.runtime.getURL(
                    "warning.html"
                );


            const destination =
                encodeURIComponent(
                    details.url
                );


            const reasons =
                encodeURIComponent(
                    JSON.stringify(warnings)
                );


            chrome.tabs.update(
                details.tabId,
                {
                    url:
                        warningPage +
                        "?url=" +
                        destination +
                        "&warnings=" +
                        reasons
                }
            );
        }
    }
);
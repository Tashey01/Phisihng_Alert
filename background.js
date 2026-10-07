// =====================================================
// CONFIGURATION
// =====================================================

const KNOWN_BRANDS = {
    google: ["google.com"],
    microsoft: ["microsoft.com", "microsoftonline.com"],
    paypal: ["paypal.com"],
    apple: ["apple.com"]
};


// URLs temporarily allowed after the user clicks
// "Continue Anyway".
const allowedOnce = new Set();


// =====================================================
// R1: IP-ADDRESS HOSTNAME
// =====================================================

function isIPAddress(hostname) {

    const parts = hostname.split(".");

    if (parts.length !== 4) {
        return false;
    }

    return parts.every(part => {

        // Must contain digits only
        if (!/^\d{1,3}$/.test(part)) {
            return false;
        }

        const number = Number(part);

        // Valid IPv4 octet range
        return number >= 0 && number <= 255;
    });
}


// =====================================================
// R2: BRAND / DOMAIN MISMATCH
// =====================================================

function checkBrandMismatch(hostname) {

    const warnings = [];

    for (const brand in KNOWN_BRANDS) {

        // Does the hostname contain the brand word?
        if (hostname.includes(brand)) {

            const officialDomains =
                KNOWN_BRANDS[brand];

            // Check whether hostname is the official domain
            // or a legitimate subdomain of it.
            const legitimate =
                officialDomains.some(domain =>
                    hostname === domain ||
                    hostname.endsWith("." + domain)
                );

            if (!legitimate) {

                warnings.push({
                    rule: "R2",
                    title: "Brand/domain mismatch",
                    message:
                        `The URL contains the trusted-looking word ` +
                        `'${brand}', but the hostname is not one of ` +
                        `the expected ${brand} domains.`
                });
            }
        }
    }

    return warnings;
}


// =====================================================
// R3: COMPLEX HOSTNAME
// =====================================================

function hasManyDomainParts(hostname) {

    const parts =
        hostname
            .split(".")
            .filter(part => part.length > 0);

    // Researcher-defined prototype threshold:
    // more than 4 hostname components
    return parts.length > 4;
}


// =====================================================
// R4: URL USERINFO INDICATOR
// =====================================================

function hasUserInfo(url) {

    return (
        url.username.length > 0 ||
        url.password.length > 0
    );
}


// =====================================================
// ANALYSE URL
// =====================================================

function analyseURL(urlString) {

    const warnings = [];

    try {

        const url =
            new URL(urlString);

        const hostname =
            url.hostname.toLowerCase();


        // -------------------------
        // R1: IP hostname
        // -------------------------

        if (isIPAddress(hostname)) {

            warnings.push({
                rule: "R1",
                title: "IP-address hostname",
                message:
                    "This URL uses an IP address instead of " +
                    "a normal domain name."
            });
        }


        // -------------------------
        // R2: Brand mismatch
        // -------------------------

        warnings.push(
            ...checkBrandMismatch(hostname)
        );


        // -------------------------
        // R3: Complex hostname
        // -------------------------

        if (hasManyDomainParts(hostname)) {

            warnings.push({
                rule: "R3",
                title: "Complex hostname",
                message:
                    "This URL contains several hostname components. " +
                    "Check the actual domain carefully."
            });
        }


        // -------------------------
        // R4: URL userinfo
        // -------------------------

        if (hasUserInfo(url)) {

            warnings.push({
                rule: "R4",
                title: "URL user-information detected",
                message:
                    "This URL contains user-information before the " +
                    "destination hostname. This can make the actual " +
                    "destination more difficult to identify."
            });
        }

    }

    catch (error) {

        console.log(
            "Could not analyse URL:",
            urlString,
            error
        );
    }

    return warnings;
}


// =====================================================
// ALLOW-ONCE MESSAGE
// =====================================================

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {

        if (
            message.type === "ALLOW_ONCE" &&
            message.url
        ) {

            allowedOnce.add(message.url);

            sendResponse({
                success: true
            });
        }
    }
);


// =====================================================
// WATCH BROWSER NAVIGATION
// =====================================================

chrome.webNavigation.onBeforeNavigate.addListener(
    function(details) {

        // Analyse only the main browser frame.
        if (details.frameId !== 0) {
            return;
        }


        // Ignore extension/internal pages.
        if (
            details.url.startsWith("chrome://") ||
            details.url.startsWith("chrome-extension://") ||
            details.url.startsWith("brave://") ||
            details.url.startsWith("edge://")
        ) {
            return;
        }


        // If the user selected "Continue Anyway",
        // allow this exact URL once.
        if (allowedOnce.has(details.url)) {

            allowedOnce.delete(details.url);

            return;
        }


        const warnings =
            analyseURL(details.url);


        // No selected characteristic detected.
        if (warnings.length === 0) {
            return;
        }


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
);
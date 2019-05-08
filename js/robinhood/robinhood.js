displayOverlay("Syncing Mint and Robinhood...", "This window will automatically close when the sync is complete");

$(document).ready(function() {
    $(`<script>
        // Override the XHR and monitor for portfolio amount (equity)
        (function() {
            var originalRequest = window.XMLHttpRequest.prototype.send;
            window.XMLHttpRequest.prototype.send = function() {

                var originalRequestReadyStateChange = this.onreadystatechange;

                this.onreadystatechange = function() {
                    if (this.response.indexOf('equity')) {
                        var portfolioAmount = JSON.parse(this.response).equity;
                        if (portfolioAmount) {
                            document.getElementById("portfolioAmount").value = portfolioAmount;
                        }
                    }
                    return originalRequestReadyStateChange.apply(this, [].slice.call(arguments));
                }
                return originalRequest.apply(this, [].slice.call(arguments));
            }
        })();
    </script>`).appendTo("body");
    waitForElement("#react_root", function() {
        console.log("Found #react_root...");
        waitForElementUnload("#application_loading", function() {
            console.log("Detected application loading complete...")
            function sendPortfolioValue() {
                $("<input id='portfolioAmount'></input>").appendTo("body");

                function checkForPortfolioAmount() {
                    if ($("#portfolioAmount").val()) {
                        chrome.runtime.sendMessage({"triggerEvent": "portfolioAmount", "portfolioAmount": $("#portfolioAmount").val()});
                        chrome.runtime.sendMessage({"triggerEvent": "closeTab"});
                    } else {
                        setTimeout(function() {
                            checkForPortfolioAmount();
                        }, 200);
                    }
                }
                checkForPortfolioAmount();
            }
            if (jQuery("*:contains('Sign In')").length) {
                chrome.runtime.sendMessage({"triggerEvent": "robinhood-login"});
                chrome.runtime.sendMessage({"triggerEvent": "closeTab"});
            } else {
                sendPortfolioValue();
            }
        });
    });
});

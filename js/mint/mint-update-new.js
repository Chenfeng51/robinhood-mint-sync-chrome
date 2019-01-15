displayOverlay("Syncing Mint and Robinhood...","This window will automatically close when the sync is complete");

var urlParams = new URLSearchParams(window.location.search);

// Request providers from Mint
jQuery.ajax({
	url: "/mas/v1/providers",
	method: "GET",
	dataType: "json",
	beforeSend: function(xhr) {
		// Set the authorization header from Mint
		xhr.setRequestHeader("authorization", "Intuit_APIKey intuit_apikey=" + MintConfig.browserAuthAPIKey + ", intuit_apikey_version=1.0");
    },
	success: function(response) {
		// Create an array to store potential Robinhood properties
        var robinhoodAccountProperty = [];

		// Store Robinhood properties
		response.providers.forEach(function(provider, i) {
			if (provider.providerAccounts[0].name == "Robinhood Account") {
				robinhoodAccountProperty.push(provider);
            }
        });

		if (robinhoodAccountProperty.length < 1) {
			// If the Robinhood property is missing
			console.warn("Unable to find Robinhood account.");
			// Send error notice to Mint page
		} else if (robinhoodAccountProperty.length > 1) {
			// If there are too many Robinhood properties
			console.warn("Found multiple properties with correct name.");
			// Send error notice to Mint page
		} else {
			// Found Robinhood property, update it
			var links = robinhoodAccountProperty[0].metaData.link;

			// Build URL for property update
			var updateURL = "/mas";
			links.forEach(function(link, i) {
				// Find the link with update operation
				if (link.operation == "updateProvider") {
					updateURL += link.href;
				}
			});
			updateURL += "/accounts/" + robinhoodAccountProperty[0].providerAccounts[0].id;

			var updateData = {
				"name": "Robinhood Account",
				"value": urlParams.get("portfolioAmount"),
				"associatedLoanAccounts": [],
				"hasAssociatedLoanAccounts": false,
				"type": "OtherPropertyAccount"
			};

			console.log(updateURL);
			console.log(updateData);

			// Send update AJAX
			jQuery.ajax({
				url: updateURL,
				method: "PATCH",
				dataType: "json",
    			contentType: "application/json; charset=utf-8",
				beforeSend: function(xhr) {
					// Set the authorization header from Mint
					xhr.setRequestHeader("authorization", "Intuit_APIKey intuit_apikey=" + MintConfig.browserAuthAPIKey + ", intuit_apikey_version=1.0");
			    },
    			data: JSON.stringify(updateData),
				success: function(response) {

				}
			});
		}
    }
});

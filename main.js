const { clipboard } = require("electron");

let propertyToCopy = null;

module.exports.templateTags = [{
    name: "copy_to_clipboard",
    displayName: "Copy to Clipboard",
    description: "Copy response or property value to clipboard",
    args: [
        {
            displayName: "Property to copy (empty value will copy the response)",
            type: "string",
            defaultValue: ""
        }
    ],
    async run(context, property) {
        propertyToCopy = property;
    }
}];

module.exports.responseHooks = [
    context => {
        if (propertyToCopy == undefined || propertyToCopy === null || typeof propertyToCopy !== "string") {
            return;
        }
        if (context.response.getStatusCode() !== 200) {
            return;
        }

        try {
            let response = "";
            let responseBody = context.response.getBody().toString("utf-8");
            if (!propertyToCopy || propertyToCopy.length === 0) {
                response = responseBody;
            } else {
                response = JSON.parse(responseBody);
                propertyToCopy = propertyToCopy.split(".");
                for (var i = 0; i < propertyToCopy.length; i++) {
                    if (response[propertyToCopy[i]] == undefined) {
                        throw new Error(`${propertyToCopy[i]} not found`);
                    } else {
                        response = response[propertyToCopy[i]];
                    }
                }
            }

            if (typeof response === "string") {
                clipboard.write({
                    text: response
                });
            }

            propertyToCopy = null;
        } catch (error) {
            console.log(`Error copying response or property value to clipboard with message ${error.message}`, error);
            throw error;
        }
    }
];

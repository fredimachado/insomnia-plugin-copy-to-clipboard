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
        const storageKey = `${context.meta.requestId}.propertyToCopy`;

        await context.store.setItem(storageKey, property || "");

        return null;
    }
}];

module.exports.responseHooks = [
    async context => {
        const statusCode = Number(context.response.getStatusCode());
        if (!Number.isFinite(statusCode) || statusCode < 200 || statusCode >= 300) {
            return;
        }

        const requestId = context.request.getId();
        const storageKey = `${requestId}.propertyToCopy`;
        let propertyToCopy = await context.store.getItem(storageKey);

        if (!propertyToCopy && propertyToCopy !== "") {
            return;
        }

        try {
            let response = "";
            let responseBody = await context.response.getBody();
            responseBody = responseBody.toString("utf-8");
            if (!propertyToCopy || propertyToCopy.length === 0) {
                response = responseBody;
            } else {
                response = JSON.parse(responseBody);
                propertyToCopy = propertyToCopy.split(".");
                for (let i = 0; i < propertyToCopy.length; i++) {
                    const key = propertyToCopy[i];
                    if (response === null || typeof response !== "object" || !Object.prototype.hasOwnProperty.call(response, key)) {
                        context.app.alert('Error', `${propertyToCopy[i]} not found`);
                        return;
                    } else {
                        response = response[key];
                    }
                }
            }

            const textToCopy = typeof response === "string"
                ? response
                : (typeof response === "object" && response !== null ? JSON.stringify(response) : String(response));
            context.app.clipboard.writeText(textToCopy);
        } catch (error) {
            context.app.alert('Error', `Error copying response or property value to clipboard with message ${error.message}`);
        }
    }
];

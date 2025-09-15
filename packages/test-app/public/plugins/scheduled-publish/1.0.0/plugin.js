(() => {
    return {
        name: "Scheduled Publish",
        version: "1.0.0",
        description: "Allows scheduling a blog post to be published at a later time.",
        author: "Gemini",
        url: "http://localhost:3248/plugins/scheduled-publish/1.0.0/plugin.js",
        server: {
            type: "url",
            url: "http://localhost:3248/plugins/scheduled-publish/1.0.0/server.js"
        },
        client: {
            type: "url",
            url: "http://localhost:3248/plugins/scheduled-publish/1.0.0/client.js"
        }
    }
})()
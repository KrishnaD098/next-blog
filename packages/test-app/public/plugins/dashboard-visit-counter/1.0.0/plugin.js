(() => {
    return {
        name: "Dashboard Visit Counter",
        version: "1.0.0",
        description: "Counts how many times the dashboard has been visited.",
        author: "Next-Blog Team",
        url: "http://localhost:3248/plugins/dashboard-visit-counter/1.0.0/plugin.js",
        server: {
            type: "url",
            url: "http://localhost:3248/plugins/dashboard-visit-counter/1.0.0/server.js"
        },
        client: {
            type: "url",
            url: "http://localhost:3248/plugins/dashboard-visit-counter/1.0.0/client.js"
        }
    }
})()
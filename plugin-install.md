youc# Plugin Installation and Execution Flow

This document outlines the process of installing and executing a plugin in Next-Blog, using the `simple-increment-krishna` plugin as an example.

## 1. Plugin Structure

A Next-Blog plugin consists of at least a manifest file (`plugin.js`) and can optionally have client-side (`client.js`) and server-side (`server.js`) code.

### `plugin.js` (Manifest)

The manifest file contains the metadata for the plugin, such as its name, version, description, and URLs for the client and server code.

**Example: `simple-increment-krishna/1.0.0/plugin.js`**

```javascript
(()=>{
    return {
        name: "Simple Increment krishna",
        version: "1.0.0",
        description: "A simple increment plugin that increments a number every time the dashboard is refreshed.",
        author: "Next-Blog Team",
        url: "http://localhost:3248/plugins/simple-increment-krishna/1.0.0/plugin.js",
        client: {
            type: "url",
            url: "http://localhost:3248/plugins/simple-increment-krishna/1.0.0/client.js"
        }
    }
})()
```

### `client.js`

The client-side code contains the logic that runs in the user's browser. It can define hooks that the dashboard can use to render UI components or perform actions.

**Example: `simple-increment-krishna/1.0.0/client.js`**

```javascript
(() => {
    const pluginState = {
        count: 0
    };

    function dashboardWidget1(sdk) {
        const handleIncrement = () => {
            pluginState.count++;
            sdk.refresh();
        };

        const handleDecrement = () => {
            pluginState.count--;
            sdk.refresh();
        };

        return ['div', { class: 'p-4 border border-gray-100 rounded my-2' },
            ['h3', { class: 'font-bold' }, 'Counter'],
            ['p', {}, `Current count: ${pluginState.count}`],
            ['div', { class: 'flex space-x-2 mt-2' },
                ['button', { onClick: handleIncrement, class: 'btn p-2 border border-gray-100 rounded' }, 'Increment'],
                ['button', { onClick: handleDecrement, class: 'btn p-2 border border-gray-100 rounded' }, 'Decrement']
            ]
        ];
    }
    return {
        hooks: {
            "increment-widget-krishna": dashboardWidget1
        }
    };
})();
```

This `client.js` file defines a hook named `increment-widget-krishna` which returns a UI component to be rendered on the dashboard.

## 2. Installation Process

The installation process is handled by the `installPlugin` function in `packages/core/src/plugins/pluginManager.ts`.

1.  **Provide URL**: The user provides the URL to the plugin's manifest file (`plugin.js`).
2.  **Fetch Manifest**: `installPlugin` fetches the manifest file from the URL.
3.  **Create Plugin Entry**: It creates a new plugin entry in the database with the information from the manifest.
4.  **Load Modules**: It checks for `client.url` and `server.url` in the manifest. If found, it fetches the corresponding code using `loadPluginModule`.
5.  **Register Hooks**: For each module (client and server), it calls `registerHooks` to register the hooks defined in the module. `registerHooks` adds an entry to the `pluginHookMappings` table in the database for each hook, linking the hook name to the plugin.

## 3. Execution Flow

1.  **Dashboard Load**: When the dashboard loads, it needs to render all the registered widgets.
2.  **Query Hooks**: The dashboard code queries the `pluginHookMappings` table to get all the hooks of a specific type (e.g., `dashboard-widget`).
3.  **Find Plugin**: For each hook, it finds the corresponding plugin in the `plugins` table.
4.  **Load Plugin Code**: It uses the `client.url` from the plugin to fetch the client-side code of the plugin using `loadPluginModule`.
5.  **Execute Hook**: Once the plugin module is loaded, it accesses the `hooks` object and finds the function associated with the hook name (e.g., `increment-widget-krishna`).
6.  **Render UI**: It then calls that function (`dashboardWidget1` in this case), which returns a UI component. This component is then rendered on the dashboard.
import {defineClient} from '@supergrowthai/plugin-dev-kit';
import type { ClientSDK } from '@supergrowthai/types';

// Persistent state object for the settings panel
const settingsState = {
    initialized: false,
    isLoading: true,
    settings: {
        geminiApiKey: '',
        modelName: 'gemini-1.5-flash',
        schedule: '10:00,17:00',
    },
    error: null as string | null,
};

// Function to load settings via RPC
async function loadSettings(sdk: ClientSDK) {
    if (settingsState.initialized) return;

    settingsState.isLoading = true;
    sdk.refresh();

    try {
        const savedSettings = await sdk.callRPC('scheduled-post:getSettings', {});
        if (savedSettings) {
            settingsState.settings = { ...settingsState.settings, ...savedSettings };
        }
        settingsState.initialized = true;
    } catch (e: any) {
        settingsState.error = 'Failed to load settings: ' + e.message;
        sdk.notify(settingsState.error, 'error');
    } finally {
        settingsState.isLoading = false;
        sdk.refresh();
    }
}

// Function to save settings via RPC
async function saveSettings(sdk: ClientSDK) {
    try {
        await sdk.callRPC('scheduled-post:saveSettings', settingsState.settings);
        sdk.notify('Settings saved successfully!', 'success');
    } catch (e: any) {
        sdk.notify('Failed to save settings: ' + e.message, 'error');
    }
}

// The UI component for the settings panel
function SettingsPanel(sdk: ClientSDK) {
    // Load settings on initial render
    if (!settingsState.initialized) {
        loadSettings(sdk);
    }

    if (settingsState.isLoading) {
        return <div className="p-4">Loading settings...</div>;
    }

    if (settingsState.error) {
        return <div className="p-4 text-red-600">Error: {settingsState.error}</div>;
    }

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        settingsState.settings = {
            ...settingsState.settings,
            [name]: value,
        };
        sdk.refresh(); // Re-render the component with new state
    };

    const handleSave = () => {
        saveSettings(sdk);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Scheduled Post Generator Settings</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-lg font-semibold mb-2">Gemini API Key</label>
                    <input
                        type="text"
                        name="geminiApiKey"
                        value={settingsState.settings.geminiApiKey}
                        onChange={handleInputChange}
                        placeholder="Enter your Gemini API Key"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">Gemini Model Name</label>
                    <input
                        type="text"
                        name="modelName"
                        value={settingsState.settings.modelName}
                        onChange={handleInputChange}
                        placeholder="e.g., gemini-1.5-flash"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">Schedule</label>
                    <input
                        type="text"
                        name="schedule"
                        value={settingsState.settings.schedule}
                        onChange={handleInputChange}
                        placeholder="e.g., 10:00,17:00"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-2">Enter comma-separated times in 24-hour HH:mm format (UTC).</p>
                </div>
                <div>
                    <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

export default defineClient({
    hooks: {
        'system:plugin:settings-panel': SettingsPanel,
    },
    hasSettingsPanel: true,
});
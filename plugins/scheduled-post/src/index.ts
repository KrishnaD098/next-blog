import {definePlugin} from '@supergrowthai/plugin-dev-kit';

export default definePlugin({
    id: 'scheduled-post',
    name: 'Scheduled Post Generator',
    version: '1.0.0',
    description: 'Generates blog posts automatically using the Gemini API on a defined schedule.',
    author: 'Next-blog Team',
    permissions: ['blogs:read', 'blogs:write'],
    slots: ['system:plugin:settings-panel'],
    config: {
        geminiApiKey: {
            type: 'string',
            required: true,
            description: 'Your Google Gemini API Key'
        },
        schedule: {
            type: 'string',
            required: true,
            default: 'never',
            description: 'Schedule for generating posts (e.g., "daily", "hourly", "every 5 minutes")'
        },
        lastGenerated: {
            type: 'string',
            required: false,
            description: 'Timestamp of the last generated post'
        },
        generationInProgress: {
            type: 'boolean',
            required: false,
            default: false,
            description: 'Flag to prevent multiple simultaneous generations'
        }
    },
});
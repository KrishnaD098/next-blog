import {definePlugin} from '@supergrowthai/plugin-dev-kit';

// Plugin manifest - URLs are auto-injected during build
export default definePlugin({
    id: 'scheduled-blog-generator',
    name: 'Scheduled Blog Generator',
    version: '1.0.0',
    description: 'Generates blog posts automatically using the Gemini API on a defined schedule.',
    author: 'Next-blog Team',
    permissions: ['blogs:read', 'blogs:write'],
    slots: ['system:plugin:settings-panel'],
});
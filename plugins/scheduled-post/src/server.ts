import { defineServer } from '@supergrowthai/plugin-dev-kit';
import type { ServerSDK } from '@supergrowthai/types';

// --- Constants ---

const topics = [
    "The Future of Renewable Energy",
    "A Beginner's Guide to Machine Learning",
    "The Importance of Mindfulness in a Hectic World",
    "Exploring the Deep Sea: Earth's Final Frontier",
    "The Rise of Vertical Farming",
];


const SETTINGS_ID = 'plugin_config';

// --- Core Blog Generation Logic ---

async function generateAIBlogContent(topic: string, apiKey: string, modelName: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: `Write a blog post about "${topic}". Output plain text.` }] }] };

    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API failed:', errorText);
            throw new Error(`Gemini API request failed: ${errorText}`);
        }
        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
    } catch (err: any) {
        console.error('Error calling Gemini API:', err);
        throw new Error(`Error calling Gemini API: ${err.message}`);
    }
}

async function createAndPublishAIBlog(sdk: ServerSDK, apiKey: string, modelName: string) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const [content] = await Promise.all([generateAIBlogContent(topic, apiKey, modelName)]);
    if (!content) {
        throw new Error('Failed to generate blog content from AI.');
    }
    // The collection for blogs is `blogs`, not our settings collection.
    const blog = await sdk.db.blogs.create({
        title: topic,
        slug: topic.toLowerCase().replace(/ /g, '-'),
        content,
        status: 'draft',
        author: 'Gemini AI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { source: 'gemini-ai-post' }
    });
    console.log(`blog generated and its name ${blog.title} and id ${blog._id}`);
    return blog;
}


export default defineServer({
    hooks: {
        'every-minute-blog': async (sdk) => {
            try {
                console.log('[Scheduled Post] Running every-minute-blog hook...');
                const settings = await sdk.settings.get(SETTINGS_ID);

                if (!settings || !settings.geminiApiKey || !settings.modelName || !settings.schedule) {
                    console.log('[Scheduled Post] Plugin not configured. Please save settings in the plugin configuration panel.');
                    return { success: false, message: 'Plugin not configured.' };
                }

                const now = new Date();
                const currentHour = now.getUTCHours();
                const currentMinute = now.getUTCMinutes();
                console.log(`[Scheduled Post] Current UTC time: ${currentHour}:${String(currentMinute).padStart(2, '0')}`);

                const scheduledTimes = settings.schedule.split(',').map((time: string) => {
                    const [hour, minute] = time.trim().split(':');
                    return { hour: parseInt(hour, 10), minute: parseInt(minute, 10) };
                }).filter((time: { hour: number; minute: number; }) => {
                    return !isNaN(time.hour) && !isNaN(time.minute);
                });

                console.log(`[Scheduled Post] Scheduled times (UTC): ${JSON.stringify(scheduledTimes)}`);

                const isScheduledTime = scheduledTimes.some((t: { hour: number; minute: number; }) => t.hour === currentHour && t.minute === currentMinute);

                if (!isScheduledTime) {
                    console.log('[Scheduled Post] Not a scheduled time. Skipping blog generation.');
                    return { success: false, message: 'Not a scheduled time.' };
                }

                console.log(`[Scheduled Post] Scheduled time detected (${currentHour}:${String(currentMinute).padStart(2, '0')} UTC). Starting blog generation...`);
                const blog = await createAndPublishAIBlog(sdk, settings.geminiApiKey, settings.modelName);
                return { success: true, message: `Successfully generated AI blog post.`, blogId: blog?._id };

            } catch (error: any) {
                console.error('[Scheduled Post] AI Blog Post Generator hook error:', error);
                return { success: false, message: `Failed to generate blog: ${error.message}` };
            }
        }
    },
    rpcs: {
        'scheduled-post:getSettings': async (sdk) => {
            const settings = await sdk.settings.get(SETTINGS_ID);
            return {
                geminiApiKey: settings?.geminiApiKey || '',
                modelName: settings?.modelName,
                schedule: settings?.schedule || '10:00,17:00',
            };
        },
        'scheduled-post:saveSettings': async (sdk, newSettings) => {
            await sdk.settings.set(SETTINGS_ID, newSettings)
            return { success: true };
        }
    }
});

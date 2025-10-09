import { defineServer } from '@supergrowthai/plugin-dev-kit';
import type { ServerSDK } from '@supergrowthai/types';

const topics = [
    "The Future of Renewable Energy",
    "A Beginner's Guide to Machine Learning",
    "The Importance of Mindfulness in a Hectic World",
    "Exploring the Deep Sea: Earth's Final Frontier",
    "The Rise of Vertical Farming",
];


async function generateAIBlogContent(topic: string, apiKey: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: `Write a blog post about "${topic}". Output plain text.` }] }],
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('Gemini API failed:', await response.text());
            return null;
        }

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
    } catch (err) {
        console.error('Error calling Gemini API:', err);
        return null;
    }
}

const createAndPublishAIBlog = async (sdk: ServerSDK, apiKey: string) => {
    if (!apiKey) {
        throw new Error('Gemini API key was not provided.');
    }
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const content = await generateAIBlogContent(topic, apiKey);
    if (!content) {
        console.error('Failed to generate blog content from AI.');
        return null;
    }
    const blog = await sdk.db.blogs.create({
        title: topic,
        content,
        status: 'draft',
        author: 'Gemini AI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { source: 'gemini-ai-post' }
    });
    console.log(`Successfully created AI-generated blog with ID ${blog._id}`);
    return blog;
};


export default defineServer({
    hooks: {
        'every-minute-blog': async (sdk, context) => {
            try {
                const now = new Date();
                const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
                const nowIST = new Date(now.getTime() + IST_OFFSET_MS);

                const currentHourIST = nowIST.getUTCHours();
                const currentMinuteIST = nowIST.getUTCMinutes();

                const scheduledTimes = [
                    { hour: 10, minute: 0 },
                    { hour: 17, minute: 0 },
                    // { hour: 4, minute: 25 }, for testing purpose
                ];

                const isScheduledTime = scheduledTimes.some(
                    time => time.hour === currentHourIST && time.minute === currentMinuteIST
                );

                if (!isScheduledTime) {
                    console.log(`AI Blog Generator: Not a scheduled time. Current IST: ${currentHourIST}:${String(currentMinuteIST).padStart(2, '0')}`);
                    return { success: false, message: 'Not a scheduled time.' };
                }

                console.log(`AI Blog Generator: Scheduled time detected (${currentHourIST}:${String(currentMinuteIST).padStart(2, '0')} IST). Checking if generation is needed.`);

                const apiKey = "GEMINI_API_KEY";
                if (!apiKey) {
                    console.error('AI Blog Generator: Gemini API Key is not configured in the plugin settings.');
                    return { success: false, message: 'Gemini API Key not configured.' };
                }

                const allPosts = await sdk.db.blogs.find({});
                const aiPosts = allPosts.filter(post => post.metadata?.source === 'gemini-ai-post');
                aiPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const lastPost = aiPosts.length > 0 ? aiPosts[0] : null;

                if (lastPost) {
                    const minutesSinceLastPost = (now.getTime() - new Date(lastPost.createdAt).getTime()) / (1000 * 60);
                    if (minutesSinceLastPost < 5) { // 5 minute buffer to prevent double-generation
                        console.log(`Skipping: An AI post was already generated ${minutesSinceLastPost.toFixed(2)} minutes ago.`);
                        return { success: false, message: 'A post was recently generated.' };
                    }
                }

                console.log('All conditions met. Starting blog generation process...');
                const blog = await createAndPublishAIBlog(sdk, apiKey);

                if (!blog) {
                    return { success: false, message: 'Failed to create blog post.' };
                }

                return {
                    success: true,
                    message: `Successfully generated AI blog post.`,
                    blogId: blog._id
                };
            } catch (error) {
                console.error('AI Blog Post Generator hook error:', error);
                return {
                    success: false,
                    message: `Failed to generate blog: ${error}`
                };
            }
        }
    },
});
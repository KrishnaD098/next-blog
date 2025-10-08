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

const createAndPublishAIBlog = async (sdk: ServerSDK) => {
    const apiKey = "GEMINI_API_KEY";
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable not set.');
    }
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const content = await generateAIBlogContent(topic, apiKey);
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
                console.log('AI Blog Generator: Checking conditions...');

                const allPosts = await sdk.db.blogs.find({});
                allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const lastPost = allPosts.length > 0 ? allPosts[0] : null;

                const now = new Date();
                if (lastPost) {
                    const hoursSinceLastPost = (now.getTime() - new Date(lastPost.createdAt).getTime()) / (1000 * 60 * 60);
                    if (hoursSinceLastPost < 12) {
                        console.log(`Skipping: Only ${hoursSinceLastPost.toFixed(2)} hours have passed since the last post (12-hour rule).`);
                        return { success: false, message: 'Waiting for 12-hour interval.' };
                    }
                }

                const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
                const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
                const startOfDayUTC = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
                const startOfDayInUTCForIST = new Date(startOfDayUTC.getTime() - IST_OFFSET_MS);

                const aiPostsToday = allPosts.filter(post =>
                    post.metadata?.source === 'gemini-ai-post' &&
                    new Date(post.createdAt).getTime() >= startOfDayInUTCForIST.getTime()
                );

                if (aiPostsToday.length >= 2) {
                    console.log('Skipping: Daily limit of 2 AI posts has been reached for today (IST).');
                    return { success: false, message: 'Daily limit reached.' };
                }

                console.log(`All conditions met. Starting blog generation process... (${aiPostsToday.length + 1} of 2 posts for today)`);
                const blog = await createAndPublishAIBlog(sdk);

                return {
                    success: true,
                    message: `Successfully generated AI blog post.`,
                    blogId: blog._id
                };
            } catch (error) {
                console.error('AI Blog Post Generator hook error:', error);
                return {
                    success: false,
                    message: `Failed to generate blog: ${error.message}`
                };
            }
        }
    },
});
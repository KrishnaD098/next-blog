(() => {
    const schedulePost =  async (sdk, {blogId, publishAt}) => {
        if (!blogId || !publishAt) {
            sdk.log.error("schedulePost: blogId and publishAt are required.");
            return {success: false, message: "Blog ID and publish date are required."};
        }

        // The client sends a local datetime string, which the server interprets as UTC.
        // To correct for Indian Standard Time (IST), we subtract the IST offset (5.5 hours).
        const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const publishTime = new Date(publishAt).getTime() - IST_OFFSET;
        const now = Date.now();
        const delay = publishTime - now;

        if (delay <= 0) {
            sdk.log.error("schedulePost: The selected time is in the past.");
            return {success: false, message: "Please select a future time."};
        }

        sdk.log.info(`Scheduling post ${blogId} to be published in ${delay}ms.`);

        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    await sdk.db.blogs.updateOne({_id: blogId}, {$set: {status: 'published'}});
                    sdk.log.info(`Post ${blogId} has been published.`);
                    resolve({success: true, message: "Post published successfully."});
                } catch (error) {
                    sdk.log.error(`Failed to publish post ${blogId}:`, error);
                    resolve({success: false, message: "Failed to publish the post."});
                }
            }, delay);
        });
    }
    return {
        hooks: {},
        rpcs: {
            schedulePost
        }
    };
})();

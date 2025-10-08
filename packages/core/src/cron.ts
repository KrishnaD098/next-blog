import pluginExecutor from './plugins/plugin-executor.server.js';
import Logger from './utils/Logger.js';
import {DatabaseAdapter} from "@supergrowthai/types/server";

/**
 * This function is designed to be called by a cron job on an hourly basis.
 * It initializes the necessary component and executes the generic 'cron:hourly' hook.
 * Plugins can then use this hook to perform tasks every hour.
 */
export async function runJob(db: DatabaseAdapter) {
    const logger = new Logger('Cron');

    if (!pluginExecutor.initalized) {
        await pluginExecutor.initialize(db);
    }

    const sdk = {
        db,
        log: logger,
    };

    logger.info("Executing 'every-minute-blog' hook from cron job");
    await pluginExecutor.executeHook('every-minute-blog', sdk as any, {});
    logger.info("Cron job execution for 'every-minute-blog' hook completed.");
}
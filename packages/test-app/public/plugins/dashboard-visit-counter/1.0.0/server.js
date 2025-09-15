(() => {
    const SETTING_KEY = 'dashboard_visit_count';

    async function getDashboardVisitCount(sdk) {
        console.log(">>> getDashboardVisitCount called");
        const db = await sdk.db;
        const setting = await db.settings.findOne({ key: SETTING_KEY });
        return { count: setting ? setting.value : 0 };
    }
    async function incrementDashboardVisitCount(sdk) {
        console.log(">>> incrementDashboardVisitCount called");
        const db = await sdk.db
        const setting = await db.settings.findOne({ key: SETTING_KEY });

        if (setting) {
            // If count exists, increment it
            const newCount = (parseInt(setting.value, 10) || 0) + 1;
            const updatedSetting = await db.settings.updateOne(
                { key: SETTING_KEY },
                { value: newCount.toString() }
            );
            return { count: updatedSetting.value };
        } else {
            // If no record exists, create it with value 1
            await db.settings.create({
                key: SETTING_KEY,
                value: '1',
                owner: 'dashboard-visit-counter-plugin'
            });
            return { count: 1 };
        }
    }

    return {
        rpcs: {
            getDashboardVisitCount,
            incrementDashboardVisitCount
        }
    };
})();

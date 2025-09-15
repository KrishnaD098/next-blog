(() => {
    const pluginState = {
        publishAt: '',
        message: '',
        error: ''
    };

    function scheduleWidget(sdk,prev,context) {
        console.log("<<<<<<<SDK in widget:");
        if (!context || !context.blogId) {
            return ['div', {}, 'Loading scheduler...'];
        }
        const blogId = context.blogId;

        const handleSchedule = () => {
            console.log("<<<<<<<handleSchedule");
            if (!pluginState.publishAt) {
                pluginState.error = 'Please select a date and time.';
                sdk.refresh();
                return;
            }

            pluginState.error = '';
            pluginState.message = 'Scheduling...';

            sdk.callHook("schedulePost", {blogId, publishAt: pluginState.publishAt})
                .then(response => {
                    if (response.success) {
                        alert(response.message);
                        pluginState.message = 'Post scheduled successfully!';
                    } else {
                        pluginState.error = response.message || 'Failed to schedule post.';
                    }
                })
                .catch(err => {
                    pluginState.error = 'An unexpected error occurred.';
                    console.error(err);
                })
                .finally(() => {
                    sdk.refresh();
                });
        };

        const handleDateTimeChange = (sdk,context,value) => {
            pluginState.publishAt = value;
        };

        return ['div', {class: 'p-4 border border-gray-100 rounded my-2'},
            ['h3', {class: 'font-bold'}, 'Schedule Publish'],
            ['p', {class: 'text-sm text-gray-500 mb-2'}, 'Select a time to publish this post.'],
            ['input', {
                type: 'datetime-local',
                class: 'w-full p-2 border border-gray-300 rounded mb-2',
                value: pluginState.publishAt,
                onchange: handleDateTimeChange
            }],
            ['button', {
                onclick: handleSchedule,
                class: 'w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600'
            }, 'Schedule'],
            pluginState.message && ['p', {class: 'text-green-500 mt-2'}, pluginState.message],
            pluginState.error && ['p', {class: 'text-red-500 mt-2'}, pluginState.error]
        ];
    }

    return {
        hooks: {
            "editor-sidebar-widget": scheduleWidget
        }
    };
})();
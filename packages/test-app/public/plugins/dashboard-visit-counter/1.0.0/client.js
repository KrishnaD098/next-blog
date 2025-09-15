(() => {
    const STORE = {}; // per-hook: { state, setters, batching }
    const bagFor = (hook) => (STORE[hook] ||= { state: {}, setters: {}, batching: false });

    // batch: run many setters, refresh once
    const batch = (hook, sdk, fn) => {
        const bag = bagFor(hook);
        const wasBatching = bag.batching;
        bag.batching = true;
        try { fn(); } finally {x``
            bag.batching = wasBatching;          // allow nested batches
            if (!bag.batching) sdk.refresh();    // refresh once at the end
        }
    };

    const makeUseState = (hook, sdk) => (key, initialValue) => {
        const bag = bagFor(hook);

        if (!(key in bag.state)) bag.state[key] = initialValue;
        if (!(key in bag.setters)) {
            bag.setters[key] = (next) => {
                const val = (typeof next === 'function') ? next(bag.state[key]) : next;
                if (val !== bag.state[key]) {
                    bag.state[key] = val;
                    if (!bag.batching) sdk.refresh(); // skip refresh during batch
                }
            };
        }
        return [bag.state[key], bag.setters[key]];
    };

    const h = (tag, props, ...children) => [tag, props || {}, ...children];

    const visitCounterWidget = (sdk) => {
        console.log("SDK in widget:", sdk);
        const hook = "dashboard-visit-counter-widget";
        const useState = makeUseState(hook, sdk);

        const [data, setData]       = useState("data", null);
        const [error, setError]     = useState("error", null);
        const [loading, setLoading] = useState("loading", false);

        // fetch once (gate: no error, no data, not loading)
        if (!loading && !(error || data)) {
            setLoading(true);
            sdk.callHook("incrementDashboardVisitCount",{})
                .then((newCount) => {
                    batch(hook, sdk, () => {
                        setData(newCount);
                        setError(null);
                        setLoading(false);
                    });
                })
                .catch(() => {
                    batch(hook, sdk, () => {
                        setError("Failed to load");
                        setLoading(false);
                    });
                });
            // NOTE: no .finally() — we set loading=false inside the batch above
        }

        return h(
            "div", { class: "p-4 border border-gray-100 rounded my-2" },
            h("h3", { class: "font-bold" }, "Dashboard Visits"),
            h("p", {}, `Total dashboard visits: ${data?.payload?.count}${loading ? "…" : ""}`),
            error && h("p", { class: "text-red-600 text-sm" }, error)
        );
    };

    return {
        hooks: {
            "dashboard-visit-counter-widget": visitCounterWidget
        }
    };
})();

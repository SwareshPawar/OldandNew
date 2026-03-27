(function initAppApiBase(global) {
    function resolve() {
        const locationRef = global.location || {};
        const protocol = locationRef.protocol || '';
        const hostname = locationRef.hostname || '';
        const port = locationRef.port || '';
        const origin = locationRef.origin || '';
        const explicitApiBase = ((global.__API_BASE_URL__ || global.localStorage?.getItem('apiBaseUrl') || '') + '').trim();

        if (explicitApiBase) {
            return explicitApiBase.replace(/\/$/, '');
        }

        if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
            const localHost = hostname || 'localhost';
            return port === '3001' ? origin : `http://${localHost}:3001`;
        }

        if (hostname.endsWith('github.io')) {
            return 'https://oldand-new.vercel.app';
        }

        return origin;
    }

    global.AppApiBase = {
        resolve
    };
})(window);
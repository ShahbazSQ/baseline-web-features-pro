"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const webFeatures = require("web-features");
class BaselineAnalysisEngine {
    constructor() {
        this.features = new Map();
        this.detectionPatterns = new Map();
        this.statusCache = new Map();
        // this.initializeFeatures();
        // this.buildDetectionPatterns();
        // this.loadFallbackFeatures();
        this.loadFallbackFeatures(); // Load patterns first
        this.fetchLiveBaselineData();
    }
    async fetchLiveBaselineData() {
        try {
            console.log('🌐 Loading Baseline data from web-features package...');
            // Import the features data from the npm package
            const webFeaturesModule = require('web-features');
            if (!webFeaturesModule || typeof webFeaturesModule !== 'object') {
                console.warn('⚠️ web-features package not loaded correctly');
                return;
            }
            let featureCount = 0;
            // Merge live data with our patterns
            for (const [featureId, featureData] of Object.entries(webFeaturesModule)) {
                if (this.detectionPatterns.has(featureId)) {
                    const data = featureData;
                    const existingFeature = this.features.get(featureId);
                    if (existingFeature && data.status) {
                        // Update with real data from package
                        const baselineStatus = data.status.baseline_high_date ? 'widely' :
                            data.status.baseline_low_date ? 'newly' : false;
                        existingFeature.status = {
                            baseline_status: baselineStatus,
                            baseline_low_date: data.status.baseline_low_date,
                            baseline_high_date: data.status.baseline_high_date,
                            support: data.status.support
                        };
                        existingFeature.description = data.description || existingFeature.description;
                        existingFeature.spec = data.spec;
                        existingFeature.mdn_url = data.mdn_url;
                        featureCount++;
                    }
                }
            }
            console.log(`🎉 Successfully loaded ${featureCount} features from web-features package!`);
        }
        catch (error) {
            console.warn('⚠️ Failed to load web-features package data:', error);
        }
    }
    initializeFeatures() {
        // Load web-features data
        try {
            const featuresData = webFeatures;
            for (const [featureId, feature] of Object.entries(featuresData)) {
                if (typeof feature === 'object' && feature !== null) {
                    this.features.set(featureId, {
                        id: featureId,
                        name: feature.name || featureId.replace(/-/g, ' '),
                        description: feature.description,
                        status: feature.status || {},
                        spec: feature.spec,
                        mdn_url: feature.mdn_url
                    });
                }
            }
        }
        catch (error) {
            console.error('Failed to load web-features data:', error);
            this.loadFallbackFeatures();
        }
    }
    loadFallbackFeatures() {
        // Fallback feature set with real Baseline data
        const fallbackFeatures = [
            {
                id: 'optional-chaining',
                name: 'Optional Chaining',
                patterns: [/\?\./g],
                status: {
                    baseline_status: 'widely',
                    baseline_low_date: '2020-04-21',
                    support: {
                        chrome: '80',
                        firefox: '74',
                        safari: '13.1',
                        edge: '80'
                    }
                },
                description: 'Safe navigation operator for object properties'
            },
            {
                id: 'nullish-coalescing',
                name: 'Nullish Coalescing',
                patterns: [/\?\?/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-04-21' },
                support: {
                    chrome: '80',
                    firefox: '72',
                    safari: '13.1',
                    edge: '80'
                },
                description: 'Logical operator for null/undefined values'
            },
            {
                id: 'async-await',
                name: 'Async/Await',
                patterns: [/async\s+function/g, /await\s+/g],
                status: { baseline_status: 'widely', baseline_low_date: '2017-09-05' },
                support: {
                    chrome: '55',
                    firefox: '52',
                    safari: '10.1',
                    edge: '15'
                },
                description: 'Modern asynchronous JavaScript syntax'
            },
            {
                id: 'fetch-api',
                name: 'Fetch API',
                patterns: [/fetch\s*\(/g],
                status: { baseline_status: 'widely', baseline_low_date: '2017-03-07' },
                support: {
                    chrome: '42',
                    firefox: '39',
                    safari: '10.1',
                    edge: '14'
                },
                description: 'Modern HTTP request API'
            },
            {
                id: 'css-grid',
                name: 'CSS Grid Layout',
                patterns: [/display:\s*grid/g, /grid-template/g, /grid-area/g],
                status: { baseline_status: 'widely', baseline_low_date: '2017-03-16' },
                support: {
                    chrome: '57',
                    firefox: '52',
                    safari: '10.1',
                    edge: '16'
                },
                description: 'Two-dimensional CSS layout system'
            },
            {
                id: 'css-flexbox',
                name: 'CSS Flexbox',
                patterns: [/display:\s*flex/g, /flex-direction/g, /justify-content/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-09-13' },
                description: 'One-dimensional CSS layout method'
            },
            {
                id: 'css-custom-properties',
                name: 'CSS Custom Properties',
                patterns: [/var\(--[\w-]+\)/g, /--[\w-]+:/g],
                status: { baseline_status: 'widely', baseline_low_date: '2018-01-29' },
                description: 'CSS variables for dynamic styling'
            },
            {
                id: 'container-queries',
                name: 'CSS Container Queries',
                patterns: [/container-type/g, /@container/g],
                status: { baseline_status: 'newly', baseline_low_date: '2023-02-14' },
                description: 'Responsive design based on container size'
            },
            {
                id: 'css-cascade-layers',
                name: 'CSS Cascade Layers',
                patterns: [/@layer\s/g],
                status: { baseline_status: 'newly', baseline_low_date: '2022-03-14' },
                description: 'Explicit cascade control in CSS'
            },
            {
                id: 'web-components',
                name: 'Web Components',
                patterns: [/customElements\.define/g, /class\s+\w+\s+extends\s+HTMLElement/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-01-15' },
                description: 'Custom HTML elements'
            },
            {
                id: 'intersection-observer',
                name: 'Intersection Observer',
                patterns: [/IntersectionObserver/g],
                status: { baseline_status: 'widely', baseline_low_date: '2019-09-10' },
                description: 'Asynchronous element visibility detection'
            },
            {
                id: 'resize-observer',
                name: 'Resize Observer',
                patterns: [/ResizeObserver/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-04-21' },
                description: 'Element size change detection'
            },
            // Deprecated/problematic patterns
            {
                id: 'webkit-prefixes',
                name: 'WebKit Prefixes',
                patterns: [/-webkit-/g, /webkit[A-Z]/g],
                status: { baseline_status: false },
                description: 'Deprecated vendor prefixes'
            },
            {
                id: 'console-statements',
                name: 'Console Statements',
                patterns: [/console\.(log|warn|error|info)/g],
                status: { baseline_status: false },
                description: 'Debug statements that should be removed'
            },
            {
                id: 'eval-usage',
                name: 'Eval Usage',
                patterns: [/eval\s*\(/g],
                status: { baseline_status: false },
                description: 'Security risk - avoid eval()'
            },
            {
                id: 'template-literals',
                name: 'Template Literals',
                patterns: [/`[^`]*`/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-09-13' },
                description: 'String interpolation with backticks'
            },
            {
                id: 'destructuring-assignment',
                name: 'Destructuring Assignment',
                patterns: [/const\s*{\s*[\w,\s]+\}\s*=/g, /const\s*\[\s*[\w,\s]+\]\s*=/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-09-13' },
                description: 'Extract values from arrays/objects'
            },
            {
                id: 'spread-operator',
                name: 'Spread Operator',
                patterns: [/\.\.\.[\w]+/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-09-13' },
                description: 'Expand iterables in places'
            },
            {
                id: 'rest-parameters',
                name: 'Rest Parameters',
                patterns: [/\(.*\.\.\.[\w]+.*\)/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-09-13' },
                description: 'Collect function arguments'
            },
            {
                id: 'arrow-functions',
                name: 'Arrow Functions',
                patterns: [/=>\s*{|=>\s*\w/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-09-13' },
                description: 'Concise function syntax'
            },
            {
                id: 'promises',
                name: 'Promises',
                patterns: [/new Promise\(/g, /Promise\.(resolve|reject|all|race)/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-09-13' },
                description: 'Asynchronous operation handling'
            },
            {
                id: 'const-let',
                name: 'Block-scoped Variables',
                patterns: [/\bconst\s+/g, /\blet\s+/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-09-13' },
                description: 'Modern variable declarations'
            },
            {
                id: 'css-has-selector',
                name: 'CSS :has() Selector',
                patterns: [/:has\(/g],
                status: { baseline_status: 'newly', baseline_low_date: '2023-12-15' },
                description: 'Parent selector in CSS'
            },
            {
                id: 'css-is-selector',
                name: 'CSS :is() Selector',
                patterns: [/:is\(/g],
                status: { baseline_status: 'widely', baseline_low_date: '2021-04-20' },
                description: 'Simplified selector grouping'
            },
            {
                id: 'css-where-selector',
                name: 'CSS :where() Selector',
                patterns: [/:where\(/g],
                status: { baseline_status: 'widely', baseline_low_date: '2021-04-20' },
                description: 'Zero-specificity selector grouping'
            },
            {
                id: 'css-aspect-ratio',
                name: 'CSS aspect-ratio',
                patterns: [/aspect-ratio:/g],
                status: { baseline_status: 'widely', baseline_low_date: '2021-10-05' },
                description: 'Element aspect ratio control'
            },
            {
                id: 'css-gap',
                name: 'CSS gap Property',
                patterns: [/\bgap:/g, /row-gap:/g, /column-gap:/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-09-15' },
                description: 'Spacing in Grid and Flexbox'
            },
            {
                id: 'css-clamp',
                name: 'CSS clamp() Function',
                patterns: [/clamp\(/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-04-21' },
                description: 'Responsive value clamping'
            },
            {
                id: 'css-min-max',
                name: 'CSS min()/max() Functions',
                patterns: [/\bmin\(/g, /\bmax\(/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-04-21' },
                description: 'Dynamic value calculation'
            },
            {
                id: 'websocket',
                name: 'WebSocket API',
                patterns: [/new WebSocket\(/g, /WebSocket\(/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-07-29' },
                description: 'Real-time bidirectional communication'
            },
            {
                id: 'geolocation',
                name: 'Geolocation API',
                patterns: [/navigator\.geolocation/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-07-29' },
                description: 'Access device location'
            },
            {
                id: 'local-storage',
                name: 'Local Storage',
                patterns: [/localStorage\./g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-07-29' },
                description: 'Client-side data persistence'
            },
            {
                id: 'session-storage',
                name: 'Session Storage',
                patterns: [/sessionStorage\./g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-07-29' },
                description: 'Session-based storage'
            },
            {
                id: 'indexeddb',
                name: 'IndexedDB',
                patterns: [/indexedDB/g, /IDBDatabase/g, /IDBObjectStore/g],
                status: { baseline_status: 'widely', baseline_low_date: '2018-01-29' },
                description: 'Client-side database'
            },
            {
                id: 'mutation-observer',
                name: 'Mutation Observer',
                patterns: [/MutationObserver/g],
                status: { baseline_status: 'widely', baseline_low_date: '2015-07-29' },
                description: 'DOM change detection'
            },
            {
                id: 'service-worker',
                name: 'Service Workers',
                patterns: [/navigator\.serviceWorker/g, /ServiceWorker/g],
                status: { baseline_status: 'widely', baseline_low_date: '2018-01-29' },
                description: 'Offline functionality and caching'
            },
            {
                id: 'webrtc',
                name: 'WebRTC',
                patterns: [/RTCPeerConnection/g, /getUserMedia/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-01-15' },
                description: 'Real-time communication'
            },
            {
                id: 'css-subgrid',
                name: 'CSS Subgrid',
                patterns: [/grid-template-columns:\s*subgrid/g, /grid-template-rows:\s*subgrid/g],
                status: { baseline_status: 'newly', baseline_low_date: '2023-09-11' },
                description: 'Nested grid alignment'
            },
            {
                id: 'css-scroll-snap',
                name: 'CSS Scroll Snap',
                patterns: [/scroll-snap-type:/g, /scroll-snap-align:/g],
                status: { baseline_status: 'widely', baseline_low_date: '2019-09-10' },
                description: 'Smooth scrolling points'
            },
            {
                id: 'css-backdrop-filter',
                name: 'CSS backdrop-filter',
                patterns: [/backdrop-filter:/g],
                status: { baseline_status: 'widely', baseline_low_date: '2022-03-14' },
                description: 'Background blur effects'
            },
            {
                id: 'intl-api',
                name: 'Intl API',
                patterns: [/Intl\.(DateTimeFormat|NumberFormat|Collator)/g],
                status: { baseline_status: 'widely', baseline_low_date: '2017-09-05' },
                description: 'Internationalization support'
            },
            {
                id: 'dynamic-import',
                name: 'Dynamic Import',
                patterns: [/import\(/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-01-15' },
                description: 'Lazy loading modules'
            },
            {
                id: 'bigint',
                name: 'BigInt',
                patterns: [/\d+n\b/g, /BigInt\(/g],
                status: { baseline_status: 'widely', baseline_low_date: '2020-04-21' },
                description: 'Arbitrary precision integers'
            },
            {
                id: 'private-class-fields',
                name: 'Private Class Fields',
                patterns: [/#[\w]+/g],
                status: { baseline_status: 'widely', baseline_low_date: '2022-03-14' },
                description: 'Private class members'
            },
            {
                id: 'top-level-await',
                name: 'Top-level Await',
                patterns: [/^await\s+/gm],
                status: { baseline_status: 'widely', baseline_low_date: '2022-03-14' },
                description: 'Await outside async functions'
            }
        ];
        fallbackFeatures.forEach(feature => {
            this.features.set(feature.id, {
                id: feature.id,
                name: feature.name,
                description: feature.description,
                status: feature.status
            });
            this.detectionPatterns.set(feature.id, feature.patterns);
        });
    }
    buildDetectionPatterns() {
        // Advanced pattern building for comprehensive detection
        // This would be expanded with more sophisticated patterns
    }
    async analyzeCode(code, languageId) {
        const results = [];
        const lines = code.split('\n');
        for (const [featureId, patterns] of this.detectionPatterns) {
            const feature = this.features.get(featureId);
            if (!feature)
                continue;
            const matches = [];
            lines.forEach((line, lineIndex) => {
                patterns.forEach(pattern => {
                    let match;
                    const globalPattern = new RegExp(pattern.source, 'g');
                    while ((match = globalPattern.exec(line)) !== null) {
                        const severity = this.getSeverity(feature);
                        const recommendation = this.getRecommendation(featureId, match[0]);
                        matches.push({
                            line: lineIndex,
                            column: match.index,
                            text: match[0],
                            severity,
                            recommendation
                        });
                    }
                });
            });
            if (matches.length > 0) {
                results.push({ feature, matches });
            }
        }
        return results;
    }
    getSeverity(feature) {
        if (feature.status.baseline_status === 'widely')
            return 'info';
        if (feature.status.baseline_status === 'newly')
            return 'warning';
        if (feature.status.baseline_status === 'limited')
            return 'warning';
        return 'error';
    }
    getRecommendation(featureId, matchedText) {
        const recommendations = {
            'webkit-prefixes': 'Remove vendor prefix - this feature is now standard',
            'console-statements': 'Remove console statements before production deployment',
            'eval-usage': 'Avoid eval() - use safer alternatives like JSON.parse() or Function constructor',
            'container-queries': 'Container Queries are newly baseline (2023) - safe for modern applications',
            'css-cascade-layers': 'CSS Cascade Layers are newly baseline (2022) - consider fallbacks for older browsers',
            'optional-chaining': 'Excellent choice! Optional chaining is widely supported',
            'nullish-coalescing': 'Great modern syntax! Nullish coalescing is widely supported',
            'css-grid': 'Perfect! CSS Grid is widely supported across all modern browsers',
            'fetch-api': 'Modern and widely supported - excellent choice over XMLHttpRequest'
        };
        return recommendations[featureId] || 'Check browser compatibility for your target audience';
    }
    calculateProjectStats(results) {
        let totalFeatures = 0;
        let widelySupported = 0;
        let newlySupported = 0;
        let limitedSupport = 0;
        let notBaseline = 0;
        let securityIssues = 0;
        let performanceIssues = 0;
        results.forEach(result => {
            totalFeatures += result.matches.length;
            result.matches.forEach(match => {
                const status = result.feature.status.baseline_status;
                if (status === 'widely')
                    widelySupported++;
                else if (status === 'newly')
                    newlySupported++;
                else if (status === 'limited')
                    limitedSupport++;
                else
                    notBaseline++;
                if (match.severity === 'error') {
                    if (result.feature.id.includes('security') || result.feature.id === 'eval-usage') {
                        securityIssues++;
                    }
                    else {
                        performanceIssues++;
                    }
                }
            });
        });
        const baselineScore = totalFeatures > 0
            ? Math.round(((widelySupported * 3 + newlySupported * 2 + limitedSupport) / (totalFeatures * 3)) * 100)
            : 100;
        return {
            totalFeatures,
            widelySupported,
            newlySupported,
            limitedSupport,
            notBaseline,
            baselineScore,
            securityIssues,
            performanceIssues
        };
    }
}
class BaselineTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.results = [];
    }
    refresh(results) {
        this.results = results;
        this._onDidChangeTreeData.fire(null);
    }
    getTreeItem(element) {
        const item = new vscode.TreeItem(element.label, element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        // Set icons based on type
        if (element.type === 'category') {
            if (element.label.includes('Widely')) {
                item.iconPath = new vscode.ThemeIcon('check-all', new vscode.ThemeColor('charts.green'));
            }
            else if (element.label.includes('Newly')) {
                item.iconPath = new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'));
            }
            else if (element.label.includes('Issues')) {
                item.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red'));
            }
        }
        else if (element.type === 'feature') {
            if (element.status === 'widely') {
                item.iconPath = new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
            }
            else if (element.status === 'newly') {
                item.iconPath = new vscode.ThemeIcon('history', new vscode.ThemeColor('charts.yellow'));
            }
            else {
                item.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
            }
        }
        item.tooltip = element.tooltip;
        return item;
    }
    getChildren(element) {
        if (!element) {
            // Root level - show categories
            return this.getCategoryNodes();
        }
        // Show features in category
        return element.children || [];
    }
    getCategoryNodes() {
        const widelySupported = [];
        const newlySupported = [];
        const issues = [];
        this.results.forEach(result => {
            const status = result.feature.status.baseline_status;
            const node = {
                label: `${result.feature.name} (${result.matches.length}x)`,
                type: 'feature',
                status: status || 'none',
                tooltip: result.feature.description || result.feature.name,
                children: undefined
            };
            if (status === 'widely') {
                widelySupported.push(node);
            }
            else if (status === 'newly') {
                newlySupported.push(node);
            }
            else {
                issues.push(node);
            }
        });
        const categories = [];
        if (widelySupported.length > 0) {
            categories.push({
                label: `✅ Widely Available (${widelySupported.length})`,
                type: 'category',
                status: 'widely',
                tooltip: 'Features safe to use in all modern browsers',
                children: widelySupported
            });
        }
        if (newlySupported.length > 0) {
            categories.push({
                label: `🆕 Newly Available (${newlySupported.length})`,
                type: 'category',
                status: 'newly',
                tooltip: 'Recently became Baseline - verify browser targets',
                children: newlySupported
            });
        }
        if (issues.length > 0) {
            categories.push({
                label: `⚠️ Issues Found (${issues.length})`,
                type: 'category',
                status: 'issues',
                tooltip: 'Deprecated or non-baseline features to review',
                children: issues
            });
        }
        if (categories.length === 0) {
            return [{
                    label: 'No features detected',
                    type: 'info',
                    status: 'none',
                    tooltip: 'Run analysis to detect features',
                    children: undefined
                }];
        }
        return categories;
    }
}
class BrowserSupportProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.results = [];
    }
    refresh(results) {
        this.results = results;
        this._onDidChangeTreeData.fire(null);
    }
    getTreeItem(element) {
        const item = new vscode.TreeItem(element.label, element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        if (element.label.startsWith('🟢')) {
            item.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.green'));
        }
        else if (element.label.startsWith('🟠')) {
            item.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.orange'));
        }
        else if (element.label.startsWith('🔵')) {
            item.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.blue'));
        }
        else if (element.label.startsWith('🟣')) {
            item.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.purple'));
        }
        else if (element.label.startsWith('  -')) {
            item.iconPath = new vscode.ThemeIcon('symbol-method');
        }
        return item;
    }
    getChildren(element) {
        if (!element) {
            // Root level - show browser categories
            const browserGroups = this.groupByBrowser();
            if (browserGroups.length === 0) {
                return [{ label: 'ℹ️ No browser-specific features detected', children: undefined }];
            }
            return browserGroups;
        }
        // Show children (features for each browser)
        return element.children || [];
    }
    groupByBrowser() {
        const chromeFeatures = [];
        const firefoxFeatures = [];
        const safariFeatures = [];
        const edgeFeatures = [];
        let minChrome = 999;
        let minFirefox = 999;
        let minSafari = 999;
        let minEdge = 999;
        this.results.forEach(result => {
            if (result.feature.status.support) {
                const support = result.feature.status.support;
                const featureName = result.feature.name;
                if (support.chrome) {
                    const version = parseInt(support.chrome) || 999;
                    if (version < minChrome)
                        minChrome = version;
                    chromeFeatures.push(`  - ${featureName} (v${support.chrome}+)`);
                }
                if (support.firefox) {
                    const version = parseInt(support.firefox) || 999;
                    if (version < minFirefox)
                        minFirefox = version;
                    firefoxFeatures.push(`  - ${featureName} (v${support.firefox}+)`);
                }
                if (support.safari) {
                    const version = parseFloat(support.safari) || 999;
                    if (version < minSafari)
                        minSafari = version;
                    safariFeatures.push(`  - ${featureName} (v${support.safari}+)`);
                }
                if (support.edge) {
                    const version = parseInt(support.edge) || 999;
                    if (version < minEdge)
                        minEdge = version;
                    edgeFeatures.push(`  - ${featureName} (v${support.edge}+)`);
                }
            }
        });
        const nodes = [];
        if (chromeFeatures.length > 0) {
            nodes.push({
                label: `🟢 Chrome ${minChrome}+ (${chromeFeatures.length} features)`,
                children: chromeFeatures.map(f => ({ label: f, children: undefined }))
            });
        }
        if (firefoxFeatures.length > 0) {
            nodes.push({
                label: `🟠 Firefox ${minFirefox}+ (${firefoxFeatures.length} features)`,
                children: firefoxFeatures.map(f => ({ label: f, children: undefined }))
            });
        }
        if (safariFeatures.length > 0) {
            nodes.push({
                label: `🔵 Safari ${minSafari}+ (${safariFeatures.length} features)`,
                children: safariFeatures.map(f => ({ label: f, children: undefined }))
            });
        }
        if (edgeFeatures.length > 0) {
            nodes.push({
                label: `🟣 Edge ${minEdge}+ (${edgeFeatures.length} features)`,
                children: edgeFeatures.map(f => ({ label: f, children: undefined }))
            });
        }
        return nodes;
    }
}
class ScoreProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.stats = {
            totalFeatures: 0,
            widelySupported: 0,
            newlySupported: 0,
            limitedSupport: 0,
            notBaseline: 0,
            baselineScore: 0,
            securityIssues: 0,
            performanceIssues: 0
        };
    }
    refresh(stats) {
        this.stats = stats;
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        const item = new vscode.TreeItem(element);
        if (element.includes('Score:')) {
            item.iconPath = new vscode.ThemeIcon('graph', new vscode.ThemeColor('charts.blue'));
        }
        else if (element.includes('Widely')) {
            item.iconPath = new vscode.ThemeIcon('check-all', new vscode.ThemeColor('charts.green'));
        }
        else if (element.includes('Newly')) {
            item.iconPath = new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'));
        }
        else if (element.includes('Issues')) {
            item.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red'));
        }
        return item;
    }
    getChildren() {
        return [
            `📊 Baseline Score: ${this.stats.baselineScore}%`,
            `✅ Widely Supported: ${this.stats.widelySupported}`,
            `🆕 Newly Available: ${this.stats.newlySupported}`,
            `⚠️ Limited Support: ${this.stats.limitedSupport}`,
            `❌ Not Baseline: ${this.stats.notBaseline}`,
            `🛡️ Security Issues: ${this.stats.securityIssues}`,
            `⚡ Performance Issues: ${this.stats.performanceIssues}`
        ];
    }
}
class RecommendationsProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.recommendations = [];
    }
    refresh(results) {
        this.recommendations = this.generateRecommendations(results);
        this._onDidChangeTreeData.fire(null);
    }
    generateRecommendations(results) {
        const recs = [];
        results.forEach(result => {
            if (result.feature.status.baseline_status === false) {
                if (result.feature.id === 'webkit-prefixes') {
                    recs.push('🔧 Remove webkit prefixes - now standard');
                }
                if (result.feature.id === 'console-statements') {
                    recs.push('🧹 Remove console.log before production');
                }
                if (result.feature.id === 'eval-usage') {
                    recs.push('🛡️ Replace eval() with safer alternatives');
                }
            }
            if (result.feature.status.baseline_status === 'newly') {
                recs.push(`⏰ ${result.feature.name} is newly baseline - verify browser targets`);
            }
        });
        if (recs.length === 0) {
            recs.push('✅ No recommendations - excellent code!');
        }
        return recs;
    }
    getTreeItem(element) {
        const item = new vscode.TreeItem(element);
        item.iconPath = element.startsWith('✅')
            ? new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'))
            : new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor('charts.yellow'));
        return item;
    }
    getChildren() {
        return this.recommendations;
    }
}
function activate(context) {
    console.log('🚀 Baseline Web Features Pro is activating...');
    const analysisEngine = new BaselineAnalysisEngine();
    const treeProvider = new BaselineTreeProvider();
    const scoreProvider = new ScoreProvider();
    const browserSupportProvider = new BrowserSupportProvider();
    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'baseline.analyzeFile';
    statusBarItem.text = '$(globe) Baseline: --';
    statusBarItem.tooltip = 'Click to analyze baseline compatibility';
    statusBarItem.show();
    const recommendationsProvider = new RecommendationsProvider();
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('baselinePro');
    const hoverProvider = vscode.languages.registerHoverProvider(['javascript', 'typescript', 'html', 'css'], {
        async provideHover(document, position, token) {
            const line = document.lineAt(position.line).text;
            const code = document.getText();
            // Analyze code to find features
            const results = await analysisEngine.analyzeCode(code, document.languageId);
            // Check if cursor is on a detected feature
            for (const result of results) {
                for (const match of result.matches) {
                    if (match.line === position.line &&
                        position.character >= match.column &&
                        position.character <= match.column + match.text.length) {
                        const feature = result.feature;
                        const status = feature.status.baseline_status;
                        let statusText = '';
                        let icon = '';
                        if (status === 'widely') {
                            statusText = '✅ **Widely Available** - Safe to use everywhere';
                            icon = '🌐';
                        }
                        else if (status === 'newly') {
                            statusText = '🆕 **Newly Available** - Recently became baseline';
                            icon = '⏰';
                        }
                        else if (status === 'limited') {
                            statusText = '⚠️ **Limited Support** - Use with caution';
                            icon = '🔶';
                        }
                        else {
                            statusText = '❌ **Not Baseline** - Consider alternatives';
                            icon = '🚫';
                        }
                        const markdown = new vscode.MarkdownString();
                        markdown.isTrusted = true;
                        markdown.supportHtml = true;
                        markdown.appendMarkdown(`## ${icon} ${feature.name}\n\n`);
                        markdown.appendMarkdown(`${statusText}\n\n`);
                        if (feature.description) {
                            markdown.appendMarkdown(`**Description:** ${feature.description}\n\n`);
                        }
                        // Show browser support if available
                        if (feature.status.support) {
                            markdown.appendMarkdown(`**Browser Support:**\n`);
                            const support = feature.status.support;
                            if (support.chrome)
                                markdown.appendMarkdown(`- 🟢 Chrome ${support.chrome}+\n`);
                            if (support.firefox)
                                markdown.appendMarkdown(`- 🟠 Firefox ${support.firefox}+\n`);
                            if (support.safari)
                                markdown.appendMarkdown(`- 🔵 Safari ${support.safari}+\n`);
                            if (support.edge)
                                markdown.appendMarkdown(`- 🟣 Edge ${support.edge}+\n`);
                            markdown.appendMarkdown(`\n`);
                        }
                        if (feature.status.baseline_low_date) {
                            const date = new Date(feature.status.baseline_low_date);
                            markdown.appendMarkdown(`**Baseline Since:** ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}\n\n`);
                        }
                        if (match.recommendation) {
                            markdown.appendMarkdown(`💡 **Recommendation:** ${match.recommendation}\n\n`);
                        }
                        if (feature.spec && feature.spec.length > 0) {
                            markdown.appendMarkdown(`📚 [View Specification](${feature.spec[0]})\n\n`);
                        }
                        if (feature.mdn_url) {
                            markdown.appendMarkdown(`📖 [MDN Documentation](${feature.mdn_url})\n\n`);
                        }
                        markdown.appendMarkdown(`---\n\n*Powered by Baseline Web Features Pro*`);
                    }
                }
            }
            return null;
        }
    });
    // Register tree views
    // Register tree views
    const featureTreeView = vscode.window.createTreeView('featureAnalysis', {
        treeDataProvider: treeProvider,
        showCollapseAll: true
    });
    const scoreTreeView = vscode.window.createTreeView('baselineScore', {
        treeDataProvider: scoreProvider,
        showCollapseAll: false
    });
    const recommendationsTreeView = vscode.window.createTreeView('recommendations', {
        treeDataProvider: recommendationsProvider,
        showCollapseAll: false
    });
    const browserTreeView = vscode.window.createTreeView('browserSupport', {
        treeDataProvider: browserSupportProvider,
        showCollapseAll: false
    });
    // Main analysis command
    const analyzeFileCommand = vscode.commands.registerCommand('baseline.analyzeFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }
        const document = editor.document;
        const code = document.getText();
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "🔍 Analyzing Baseline Compatibility...",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Loading web features data...' });
            const results = await analysisEngine.analyzeCode(code, document.languageId);
            progress.report({ increment: 50, message: 'Processing compatibility data...' });
            const stats = analysisEngine.calculateProjectStats(results);
            progress.report({ increment: 80, message: 'Generating diagnostics...' });
            // Create diagnostics
            const diagnostics = [];
            results.forEach(result => {
                result.matches.forEach(match => {
                    const position = new vscode.Position(match.line, match.column);
                    const range = new vscode.Range(position, position.translate(0, match.text.length));
                    let severity = vscode.DiagnosticSeverity.Information;
                    if (match.severity === 'warning')
                        severity = vscode.DiagnosticSeverity.Warning;
                    if (match.severity === 'error')
                        severity = vscode.DiagnosticSeverity.Error;
                    const message = match.recommendation || `${result.feature.name} detected`;
                    const diagnostic = new vscode.Diagnostic(range, message, severity);
                    diagnostic.source = 'Baseline Pro';
                    diagnostic.code = result.feature.id;
                    diagnostics.push(diagnostic);
                });
            });
            diagnosticCollection.set(document.uri, diagnostics);
            // Update tree view
            // const treeData = results.map(result => ({
            //   type: 'feature',
            //   name: result.feature.name,
            //   description: result.feature.status.baseline_status || 'Not Baseline',
            //   matches: result.matches.length,
            //   baseline: result.feature.status.baseline_status,
            //   status: result.feature.status.baseline_status === 'widely' ? '✅ Widely Available' :
            //           result.feature.status.baseline_status === 'newly' ? '🆕 Newly Available' :
            //           result.feature.status.baseline_status === 'limited' ? '⚠️ Limited Support' : '❌ Not Baseline'
            // }));
            treeProvider.refresh(results);
            // treeProvider.refresh(treeData);
            recommendationsProvider.refresh(results);
            browserSupportProvider.refresh(results);
            scoreProvider.refresh(stats);
            progress.report({ increment: 100, message: 'Analysis complete!' });
            // Show results
            let scoreEmoji = stats.baselineScore >= 90 ? '🏆' :
                stats.baselineScore >= 75 ? '🎉' :
                    stats.baselineScore >= 50 ? '👍' : '⚠️';
            const message = `${scoreEmoji} Baseline Score: ${stats.baselineScore}% | Features: ${stats.totalFeatures} | Issues: ${stats.securityIssues + stats.performanceIssues}`;
            if (stats.baselineScore >= 75) {
                vscode.window.showInformationMessage(message);
            }
            else if (stats.baselineScore >= 50) {
                vscode.window.showWarningMessage(message);
            }
            else {
                vscode.window.showErrorMessage(message);
            }
            // Update status bar
            scoreEmoji = stats.baselineScore >= 90 ? '$(pass-filled)' :
                stats.baselineScore >= 75 ? '$(check)' :
                    stats.baselineScore >= 50 ? '$(warning)' : '$(error)';
            statusBarItem.text = `${scoreEmoji} Baseline: ${stats.baselineScore}%`;
            statusBarItem.tooltip = `Baseline Score: ${stats.baselineScore}% | Features: ${stats.totalFeatures} | Click to re-analyze`;
        });
    });
    // Generate comprehensive report
    const generateReportCommand = vscode.commands.registerCommand('baseline.generateReport', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const code = editor.document.getText();
        const results = await analysisEngine.analyzeCode(code, editor.document.languageId);
        const stats = analysisEngine.calculateProjectStats(results);
        const report = `# 🚀 Baseline Web Features Compatibility Report

**Generated**: ${new Date().toISOString()}  
**File**: ${editor.document.fileName}  
**Analysis Engine**: Baseline Pro v2.0

## 📊 Executive Summary

- **🏆 Baseline Score**: ${stats.baselineScore}%
- **📈 Total Features Detected**: ${stats.totalFeatures}
- **✅ Widely Available**: ${stats.widelySupported} (${Math.round(stats.widelySupported / stats.totalFeatures * 100)}%)
- **🆕 Newly Available**: ${stats.newlySupported} (${Math.round(stats.newlySupported / stats.totalFeatures * 100)}%)
- **⚠️ Limited Support**: ${stats.limitedSupport}
- **❌ Not Baseline**: ${stats.notBaseline}
- **🛡️ Security Issues**: ${stats.securityIssues}
- **⚡ Performance Issues**: ${stats.performanceIssues}

## 🔍 Detailed Feature Analysis

${results.map(result => {
            var _a;
            return `
### ${result.feature.name}
- **Baseline Status**: ${result.feature.status.baseline_status === 'widely' ? '✅ Widely Available' :
                result.feature.status.baseline_status === 'newly' ? '🆕 Newly Available' :
                    result.feature.status.baseline_status === 'limited' ? '⚠️ Limited Support' : '❌ Not Baseline'}
- **Occurrences**: ${result.matches.length}
- **Description**: ${result.feature.description || 'No description available'}
${result.matches.length > 0 ? `- **Lines**: ${result.matches.map(m => m.line + 1).join(', ')}` : ''}
${((_a = result.matches[0]) === null || _a === void 0 ? void 0 : _a.recommendation) ? `- **Recommendation**: ${result.matches[0].recommendation}` : ''}
`;
        }).join('')}

## 🎯 Recommendations

${stats.baselineScore >= 90 ? '🏆 **Excellent!** Your code uses modern, well-supported web features.' :
            stats.baselineScore >= 75 ? '🎉 **Great job!** Minor improvements possible.' :
                stats.baselineScore >= 50 ? '👍 **Good start!** Consider updating some legacy patterns.' :
                    '⚠️ **Needs attention!** Many features need modernization.'}

${stats.securityIssues > 0 ? `\n🛡️ **Security**: ${stats.securityIssues} security issue(s) found - review immediately.` : ''}
${stats.performanceIssues > 0 ? `\n⚡ **Performance**: ${stats.performanceIssues} performance issue(s) detected.` : ''}

---

*Report generated by Baseline Web Features Pro - Built for Baseline Tooling Hackathon 2025*
`;
        const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });
        vscode.window.showTextDocument(doc);
    });
    // Auto-analysis on file save
    const autoAnalysisHandler = vscode.workspace.onDidSaveTextDocument(document => {
        const config = vscode.workspace.getConfiguration('baselinePro');
        if (config.get('autoAnalysis') && ['javascript', 'typescript', 'html', 'css'].includes(document.languageId)) {
            vscode.commands.executeCommand('baseline.analyzeFile');
        }
    });
    // Register commands and providers
    context.subscriptions.push(analyzeFileCommand, generateReportCommand, autoAnalysisHandler, diagnosticCollection, featureTreeView, scoreTreeView, recommendationsTreeView, browserTreeView, hoverProvider, // ADD THIS LINE
    recommendationsTreeView, statusBarItem);
    vscode.window.showInformationMessage('🚀 Baseline Web Features Pro is ready for hackathon domination!');
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
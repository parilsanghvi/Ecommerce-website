const fs = require('fs');
const filepath = 'frontend/src/__tests__/components/Payment.test.jsx';
let content = fs.readFileSync(filepath, 'utf-8');
content = content.replace(
    /vi\.spyOn\(Storage\.prototype,\s*'getItem'\)\.mockImplementation\(\(key\) => \{\n\s*if\s*\(key\s*===\s*'orderInfo'\)\s*return\s*JSON\.stringify\(orderInfo\);\n\s*return\s*null;\n\s*\}\);/,
    `Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: vi.fn().mockImplementation((key) => {
                    if (key === 'orderInfo') return JSON.stringify(orderInfo);
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            },
            writable: true
        });`
);
fs.writeFileSync(filepath, content);
console.log('Fixed test file');

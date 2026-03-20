const fs = require('fs');
const file = 'frontend/src/component/Cart/Payment.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
    '      if (payBtn.current) payBtn.current.disabled = false;',
    '      if (payBtn && payBtn.current) payBtn.current.disabled = false;'
);
content = content.replace(
    '      if (payBtn.current) payBtn.current.disabled = false;',
    '      if (payBtn && payBtn.current) payBtn.current.disabled = false;'
);
content = content.replace(
    '      if (payBtn.current) payBtn.current.disabled = false;',
    '      if (payBtn && payBtn.current) payBtn.current.disabled = false;'
);
content = content.replace(
    '    if (payBtn.current) payBtn.current.disabled = true;',
    '    if (payBtn && payBtn.current) payBtn.current.disabled = true;'
);
fs.writeFileSync(file, content);

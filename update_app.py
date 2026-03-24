import re

with open("frontend/src/App.jsx", "r") as f:
    content = f.read()

new_content = re.sub(
    r'console\.log\("Stripe API key not found or backend unreachable"\);',
    r'// Stripe API key not found or backend unreachable',
    content
)

with open("frontend/src/App.jsx", "w") as f:
    f.write(new_content)

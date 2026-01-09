import os
import re

def migrate_imports(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"Skipping binary or unreadable file: {filepath}")
        return

    original_content = content

    # Replace @material-ui/core with @mui/material
    content = re.sub(r'import\s+(.*?)\s+from\s+["\']@material-ui/core["\']', r'import \1 from "@mui/material"', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+["\']@material-ui/core/(.*?)["\']', r'import \1 from "@mui/material/\2"', content)

    # Replace @material-ui/icons with @mui/icons-material
    content = re.sub(r'import\s+(.*?)\s+from\s+["\']@material-ui/icons["\']', r'import \1 from "@mui/icons-material"', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+["\']@material-ui/icons/(.*?)["\']', r'import \1 from "@mui/icons-material/\2"', content)

    # Replace @material-ui/lab with @mui/lab
    content = re.sub(r'import\s+(.*?)\s+from\s+["\']@material-ui/lab["\']', r'import \1 from "@mui/lab"', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+["\']@material-ui/lab/(.*?)["\']', r'import \1 from "@mui/lab/\2"', content)

    # Replace @material-ui/data-grid with @mui/x-data-grid
    content = re.sub(r'import\s+(.*?)\s+from\s+["\']@material-ui/data-grid["\']', r'import \1 from "@mui/x-data-grid"', content)

    # Replace @material-ui/styles (if any) to @mui/styles
    content = re.sub(r'import\s+(.*?)\s+from\s+["\']@material-ui/styles["\']', r'import \1 from "@mui/styles"', content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated: {filepath}")

def walk_and_migrate(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                migrate_imports(filepath)

if __name__ == "__main__":
    walk_and_migrate("frontend/src")

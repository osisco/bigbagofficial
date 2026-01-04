#!/bin/bash

# Find all TypeScript files with hardcoded colors and convert them
find /home/osama/bigbagoffecial/client -name "*.tsx" -o -name "*.ts" | grep -v node_modules | while read file; do
    if grep -q "colors\." "$file" && ! grep -q "useColors" "$file"; then
        echo "Converting: $file"
        
        # Add useColors import if not present
        if ! grep -q "useColors" "$file"; then
            sed -i 's/import.*colors.*from.*commonStyles/import { useColors, spacing, typography, borderRadius } from '\''..\/styles\/commonStyles'\'';/' "$file"
        fi
        
        # Convert function components to use dynamic colors
        if grep -q "export default function\|const.*=.*=>" "$file"; then
            # Add colors hook at the beginning of component
            sed -i '/export default function\|const.*=.*=>/a\  const colors = useColors();' "$file"
        fi
    fi
done
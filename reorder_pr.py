import re

with open('/Users/admin/Documents/JBFarmHUB/frontend/src/features/production/purchase/components/PRDetailsDialog.tsx', 'r') as f:
    lines = f.readlines()

# The blocks are defined by line numbers in the original file
# 207-226: Status chips
# 227-293: Details
# 294-375: Actions
# 376-527: Timeline
# 528-606: Items
# 607-608: End of Box and DialogContent

# We want: Status, Details, Items, Timeline, Actions

out = lines[:293] # up to Details

# Items (527 to 606) - remember 0-indexed, so 527:606
items = lines[527:606]
# Add mb: 2 to items
items[0] = items[0].replace('sx={PURCHASE_DIALOG_FIELDSET_SX}', 'sx={{ ...PURCHASE_DIALOG_FIELDSET_SX, mb: 2 }}')
out.extend(items)

# Timeline (375 to 527)
timeline = lines[375:527]
out.extend(timeline)

# Actions (293 to 375)
actions = lines[293:375]
out.extend(actions)

out.extend(lines[606:])

with open('/Users/admin/Documents/JBFarmHUB/frontend/src/features/production/purchase/components/PRDetailsDialog.tsx', 'w') as f:
    f.writelines(out)

import re

with open('/Users/admin/Documents/JBFarmHUB/frontend/src/component/test/central-pr-demo/TestCentralPRDemo.tsx', 'r') as f:
    content = f.read()

# Replace the stack direction and divider
old_stack = "<Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} divider={<Divider orientation=\"vertical\" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}>"
new_stack = "<Stack spacing={2.5}>"
content = content.replace(old_stack, new_stack)

# Replace the inner stack that had flex: 1
old_inner_stack = "<Stack spacing={2} sx={{ flex: 1 }}>"
new_inner_stack = "<Stack spacing={2}>"
content = content.replace(old_inner_stack, new_inner_stack)

# Change the Box width for the stepper
old_stepper_box = """<Box sx={{ 
        width: { xs: '100%', md: 280 }, 
        borderLeft: { md: '1px solid' }, 
        borderColor: 'divider', 
        pl: { md: 2.5 },
        pt: { xs: 2, md: 0 }
      }}>"""
new_stepper_box = """<Box sx={{ 
        width: '100%', 
        pt: 2,
        mt: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>"""
content = content.replace(old_stepper_box, new_stepper_box)

# Set Stepper to horizontal if possible, or just keep it vertical but at the bottom.
# Let's keep it vertical for now, but at the bottom, or make it horizontal by adding alternative prop?
# Actually keeping it vertical at the bottom is perfectly fine for the mockup, or we can add orientation="horizontal" if it's not set.
# The user said "ปกดิเราโชว์ด้านขวา ให้ย้ายมาด้านล่าง" (Normally we show on right, move to bottom)
# So just moving to the bottom is enough.

with open('/Users/admin/Documents/JBFarmHUB/frontend/src/component/test/central-pr-demo/TestCentralPRDemo.tsx', 'w') as f:
    f.write(content)

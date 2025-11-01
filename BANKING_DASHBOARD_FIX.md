# Banking Dashboard Icon Fix

## Issue
Runtime error: "Element type is invalid" in `AdminQuickGrid` component.

## Root Cause
The icon `PersonPlus` doesn't exist in `lucide-react`. This caused React to receive `undefined` instead of a valid component.

## Solution
Replaced `PersonPlus` with `UserPlus` which is the correct icon name in lucide-react.

## Changes Made
- `components/admin/admin-quick-grid.tsx`: Changed import from `PersonPlus` to `UserPlus`
- Updated the icon usage in the Users quick action

## Verified
- All icons now use valid lucide-react exports
- Component should render without errors


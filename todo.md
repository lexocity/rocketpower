# RocketPower — Project TODO

## Branding & Theme
- [x] Update theme.config.js with Rogers Lane colors (purple, gold, silver)
- [x] Update tailwind.config.js with brand colors
- [x] Update app.config.ts with app name and branding
- [x] Generate Rocket mascot app icon
- [x] Apply icon to all required asset locations

## Database Schema
- [x] Add absences table
- [x] Add coverage_assignments table
- [x] Add notification_log table
- [x] Add passwordHash/passwordSalt to users table
- [x] Run db:push migrations

## Authentication & Roles
- [x] Login screen with Rogers Lane branding (Settings tab)
- [x] Email/password auth routes (login, register, set-role)
- [x] Role-based navigation (Admin vs Teacher/Staff)
- [x] Push notification token stored per user

## Today's Coverage Screen
- [x] Date header with navigation arrows (prev/next day)
- [x] Section 1: Out of the Building list (absences)
- [x] Absence card with name, time badge, sub, OAM, type, employee/sub numbers
- [x] Section 2: Coverage Assignments list
- [x] Coverage card with who, covering for, location, reason badge, time badge
- [x] Pull-to-refresh
- [x] Empty state for no coverage day

## My Duties Screen
- [x] Filtered view for logged-in user's coverage assignments
- [x] Grouped by time of day
- [x] Empty state with rocket illustration

## Admin Dashboard Screen
- [x] Summary stats (absences, coverage, uncovered)
- [x] Quick action buttons (Add Absence, Add Coverage, Send Alert)
- [x] Date navigation

## Manage Absences (Admin)
- [x] List of today's absences
- [x] Add absence form (name, time, sub, OAM, type, employee#, sub#)
- [x] Edit absence inline
- [x] Delete absence with confirmation

## Manage Coverage (Admin)
- [x] List of today's coverage assignments
- [x] Add coverage form (covering staff, covering for, location, reason, time, notes)
- [x] Edit coverage inline
- [x] Delete coverage with confirmation

## Push Notifications
- [x] Register for push notifications on app launch (Settings screen)
- [x] Save Expo push token to database per user
- [x] Send Notification screen (recipient picker, title, message)
- [x] Server-side push notification delivery via Expo Push API
- [x] Notification history log

## Staff Roster (Admin)
- [x] List all registered staff users with push token status

## Settings Screen
- [x] User profile display (name, role)
- [x] Notification preferences toggle (enable/disable push)
- [x] Logout button
- [x] App info section

## Polish & UX
- [x] Color-coded time badges (All Day = purple, partial = gold)
- [x] Color-coded type/reason badges
- [x] Loading states
- [x] Error states

## Web App (Responsive / Admin Desktop)
- [x] Responsive layout: tab bar on mobile, wider layout on web
- [x] Web admin with wider table-style coverage board
- [x] Web form for adding/editing absences (full-width, keyboard-friendly)
- [x] Web form for adding/editing coverage assignments
- [x] Web staff roster management
- [x] Web send notification panel

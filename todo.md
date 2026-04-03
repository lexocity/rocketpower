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

## Registration & Account Approval
- [ ] Add "approved" status field to users table (pending/approved/rejected)
- [ ] Open registration endpoint (no admin secret required)
- [ ] Registration screen in the app (name, email, password, confirm password)
- [ ] Pending approval screen shown after registration
- [ ] Admin: Staff Management screen with approve/reject pending accounts
- [ ] Admin: Set user role (staff/admin) from staff management screen

## Notification Read Receipts
- [ ] notification_receipts table (notificationId, userId, openedAt)
- [ ] notification_recipients table (notificationId, userId, delivered)
- [ ] Record recipient list when notification is sent
- [ ] tRPC route: mark notification as opened (called on app foreground via notification tap)
- [ ] tRPC route: get receipts for a notification (admin only)
- [ ] Notify screen: expandable detail view per notification showing per-staff opened/delivered/no-token status
- [ ] App: listen for notification tap and record read receipt

## Staff Duty Roster (Pre-loaded Duties)
- [- [x] staff_duties table (staffName, dutyType, dutyLabel, timeStart, timeEnd, quarter, notes)
- [x] tRPC routes: list duties by staff name, upsert duty, delete duty
- [x] Admin: Duty Roster screen — view/add/edit/delete duties per staff member
- [x] Quarter selector (Q1/Q2/Q3/Q4) on roster screen
- [ ] Auto-fill duties when selecting "Covering For" staff in coverage assignment form
- [ ] Staff can view their own pre-loaded duties on My Duties screen

## UI Cleanup
- [x] Remove OAM, employee number, and sub number from Today tab (staff-facing view)

## Web Bulk Entry (Spreadsheet-Style)
- [x] Web-only bulk absence entry grid (spreadsheet with dropdowns, add/remove rows, save all)
- [x] Web-only bulk coverage assignment entry grid (spreadsheet with dropdowns, add/remove rows, save all)
- [x] Auto-fill coverage duties from roster when staff name is entered in bulk grid
- [x] Bulk entry accessible from Admin tab on web

## Quarter System Update
- [x] Change quarter enum from Q1/Q2/Q3/Q4 to Q1_Q3 / Q2_Q4 / all
- [x] Update schema, routers, roster screen, and bulk entry filter

## Lunch Duty Tab
- [x] Dedicated "Lunch Duty" tab showing all lunch_duty coverage assignments for the selected date
- [x] Date navigator on Lunch Duty screen
- [x] Add Lunch Duty tab to navigation for all users
- [x] Lunch Duty screen: search bar filtering by staff name AND duty/location
- [x] Roster screen: AM/Lunch/PM sub-tabs within Q1/Q3 and Q2/Q4 quarter tabs
- [x] Roster screen: 3 sub-tabs (AM / Lunch / PM) within each Q1/Q3 and Q2/Q4 quarter — AM=morning+carpool, Lunch=lunch duties, PM=afternoon duties
- [x] Bulk Entry tab: hide on mobile (iOS/Android), show only on web

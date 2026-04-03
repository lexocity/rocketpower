# RocketPower — Mobile App Design Document

## Brand Identity
- **School**: Rogers Lane Elementary School, Raleigh NC
- **Mascot**: Rocket
- **Tagline**: "Where Learning Is Out of This World!"
- **Primary Color**: Deep Purple `#490E67`
- **Secondary Color**: Gold/Yellow `#FFCD00`
- **Accent**: Silver/Gray `#A2A9AD`
- **Background (Light)**: White `#FFFFFF`
- **Background (Dark)**: Deep Navy `#0D0A12`
- **Surface (Light)**: Light Purple tint `#F5F0FA`
- **Surface (Dark)**: `#1C1527`

---

## Screen List

| Screen | Role | Description |
|--------|------|-------------|
| Login | All | OAuth login screen with school branding |
| Today's Coverage | All | Main dashboard showing today's full coverage board |
| My Duties | Teacher/Staff | Filtered view of the logged-in user's assignments |
| Coverage Detail | All | Expanded detail view of a single coverage entry |
| Admin Dashboard | Admin | Summary stats + quick actions |
| Manage Absences | Admin | Add/edit/remove "Out of Building" entries |
| Manage Coverage | Admin | Add/edit/remove coverage assignment entries |
| Staff Roster | Admin | View and manage staff profiles |
| Send Notification | Admin | Compose and send push notification to specific users |
| Notification History | Admin | Log of all sent notifications |
| Settings | All | Profile, notification preferences, dark mode toggle |

---

## Primary Content & Functionality

### Today's Coverage (Main Screen)
- Date header with day of week prominently displayed
- **Section 1 — Out of the Building**: Card list showing each absent staff member with:
  - Name, time range (color-coded: yellow = partial day, purple = all day)
  - Sub assigned (or "No Sub" / "New Sub?")
  - Type badge (Sick, Personal, Educational, etc.)
  - OAM checkbox indicator
  - Employee # and Sub #
- **Section 2 — Coverage Assignments**: Card list showing:
  - Who is covering
  - Covering for (name + location/duty)
  - Why (IEP, Subbing, Absent)
  - When (Morning Duty, Lunch Duty, specific time)
  - Color-coded type badges
- Pull-to-refresh to reload latest data
- Date navigation arrows to view past/future days

### My Duties (Teacher/Staff)
- Filtered view showing only entries where the logged-in user is the assigned coverer
- Grouped by time of day (Morning, Midday, Afternoon)
- Clear "No duties today" empty state with rocket illustration

### Admin Dashboard
- Today's absence count, coverage count, uncovered duties count
- Quick action buttons: Add Absence, Add Coverage, Send Alert
- Recent notification history preview

### Manage Absences (Admin)
- FlatList of today's absences
- Tap to edit any entry inline
- Swipe-to-delete with confirmation
- FAB (+) to add new absence entry
- Fields: Staff name, time range, sub name, OAM, type, employee #, sub #

### Manage Coverage (Admin)
- FlatList of today's coverage assignments
- Tap to edit any entry
- Swipe-to-delete with confirmation
- FAB (+) to add new coverage entry
- Fields: Covering staff, covering for, location, reason, time slot, notes

### Send Notification (Admin)
- Recipient selector: All Staff, or individual user picker
- Title and message body fields
- Preview before send
- Send button with confirmation

---

## Key User Flows

### Teacher checking duties in the morning
1. Opens app → Login screen (if not authenticated)
2. Authenticates via OAuth
3. Lands on **Today's Coverage** tab
4. Scrolls through full coverage board
5. Taps **My Duties** tab for personal filtered view

### Admin adding an absence
1. Admin opens app → **Admin Dashboard** tab
2. Taps "Add Absence" quick action button
3. Form sheet slides up with all required fields
4. Fills in staff name, time, sub info, type
5. Taps "Save" → entry appears in Today's Coverage list
6. Optionally taps "Notify Staff" to send push notification

### Admin sending a duty change notification
1. Admin taps **Send Notification** from Admin Dashboard
2. Selects recipient(s) from staff list
3. Types message (e.g., "Your lunch duty has been moved to 11:45")
4. Previews notification
5. Confirms send → push notification delivered to selected users

---

## Navigation Structure

```
Tab Bar (Bottom):
├── Today (house.fill)          ← Today's Coverage board
├── My Duties (person.fill)     ← Personal duty filter (Teacher/Staff)
├── Admin (shield.fill)         ← Admin Dashboard (Admin only)
└── Settings (gear)             ← Profile & preferences
```

Modal/Stack screens pushed from tabs:
- Coverage Detail (from Today)
- Add/Edit Absence (from Admin)
- Add/Edit Coverage (from Admin)
- Send Notification (from Admin)
- Staff Roster (from Admin)

---

## Color Usage

| Element | Color |
|---------|-------|
| Tab bar active | Gold `#FFCD00` |
| Primary buttons | Deep Purple `#490E67` |
| All Day badge | Deep Purple `#490E67` with white text |
| Partial day badge | Gold `#FFCD00` with dark text |
| Sick type badge | Soft red/pink |
| Personal type badge | Soft lavender |
| Educational type badge | Soft blue |
| Subbing reason badge | Soft green |
| IEP reason badge | Soft orange |
| Card background | Surface `#F5F0FA` |
| Section headers | Deep Purple with gold accent line |

# Part 3 - Exercise 03: Alarm Application

This Expo Go application implements an event alarm scheduler with a professional timeline-style interface and local notification support.

## Requirements Covered

- Create an alarm/event application.
- Add event information through a dedicated form.
- Schedule local notifications for future date/time values.
- Display upcoming events in a clear timeline.
- Allow events to be enabled, paused, or deleted.

## Features

- Event Schedule Board dashboard.
- Next alarm summary panel.
- Total and active event counters.
- Timeline cards for scheduled events.
- Add Event modal with:
  - title
  - date
  - time
  - note
  - notification sound toggle
- Accepts date formats:
  - `YYYY-MM-DD`
  - `DD/MM/YYYY`
- Uses Expo Notifications for local alarms.

## UI 

<img width="828" height="1792" alt="image" src="https://github.com/user-attachments/assets/1b8a3a0c-f761-4e82-b172-78100312b033" />
<img width="828" height="1792" alt="image" src="https://github.com/user-attachments/assets/eee7fadc-1481-41f2-b37c-4c917e0c4c81" />
<img width="828" height="1792" alt="image" src="https://github.com/user-attachments/assets/39434f44-bbca-437e-a544-bbaf35a14555" />
![Uploading image.png…]()

## Run

```bash
npm install
npx expo start -c
```

Scan the QR code with Expo Go. Allow notification permission when prompted.

## Expo Go Note

Expo Go supports local notifications for demo purposes, but exact behavior may vary by device permission settings and operating system notification policy.

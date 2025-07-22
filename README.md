# 🎙️ FinalCast

> 🎥 **Not Just Record — Record. Render. Release.**

FinalCast is an open-source, full-stack podcasting and video conversation platform built with the **MERN stack**, **WebRTC**, and **FFmpeg** — designed to provide creators with a **fully rendered video** after every session, without needing to manually edit timeline chunks.

---

## 🚀 Why FinalCast?

While tools like Riverside.fm are powerful, they require creators or editors to manually stitch together video chunks after every session.

🧠 FinalCast aims to **solve that pain** by:
- Recording video and audio locally
- Uploading via **S3 multipart**
- Dynamically adjusting layout as participants join/leave
- Rendering a clean, editor-ready video at the end using **FFmpeg**

> Aimed at creators, teams, and developers who want full control without costly software dependencies.

---

## 📦 Tech Stack

| Layer        | Tech Used                         |
|-------------|------------------------------------|
| Frontend    | React + Vite + TailwindCSS         |
| Backend     | Node.js + Express + Socket.IO      |
| Media       | WebRTC + MediaRecorder + FFmpeg    |
| Storage     | S3-Compatible Object Storage (MinIO/S3) |
| Uploads     | Multipart Upload + IndexedDB Buffer |
| Auth (Optional) | JWT / Magic Link (future)     |

---

## 🎯 Core Features

- 🔴 Real-time room-based video calls (WebRTC)
- 📡 Peer-to-peer media exchange with fallback signaling
- 🎙️ Multi-participant auto layout (dynamic tiling)
- 📤 S3 Multipart Uploads (with offline buffering)
- 🧠 Progressive Recovery (uploads resume if browser crashes)
- 🎞️ Final Render: Clean video with FFmpeg at session end
- 🔐 Zero-Knowledge Recording (on-device encryption)
- 🌍 Multi-language audio tracks + translated subtitles
- 🪄 Visual Timeline Editor (drag-and-drop layout)

---

## 📁 Folder Structure

FinalCast/
├── frontend/ # React Frontend
│ ├── src/
│ │ ├── hooks/ # useWebRTC, useMediaRecorder
│ │ ├── components/ # Room, VideoTile, Toolbar
│ │ ├── pages/ # JoinPage, RoomPage
│ │ └── App.jsx
├── backend/ # Express + Socket.IO backend
│ ├── index.js
│ ├── routes/
│ └── controllers/
├── scripts/ # FFmpeg rendering helpers
├── media/ # Transcoded files (temp)
├── public/
└── README.md


---

## ⚙️ Installation

```bash
# Clone the repo
git clone https://github.com/anothercoder-nik/FinalCast.git
cd Finalcast

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install

🧪 Run Locally
Start backend:
cd backend
node index.js

Start Frontend:
cd ./frontend/
npm run dev


Visit: http://localhost:5173
Open in 2 browser tabs → enter same room ID → boom, video call begins.


# 🎞️ Render Pipeline
Record each track locally using MediaRecorder

Upload in chunks via S3 multipart API

After session:

FFmpeg merges all audio+video tracks

Layout adjusts based on who joined when

Output: final.mp4 with intro/outro if needed



# To contribute:
- Fork this repo
- Create a new branch
- Submit a PR


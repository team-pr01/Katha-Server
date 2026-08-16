/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + ext;

    cb(null, name);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    "audio/mpeg",   // mp3
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "video/mp4",
    "audio/aac",
    "audio/x-m4a"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only audio/video files are allowed"), false);
  }
};

export const uploadAudio = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});
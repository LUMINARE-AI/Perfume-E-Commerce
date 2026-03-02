import axios from "axios";

export const delhiveryStaging = axios.create({
  baseURL: process.env.DELHIVERY_STAGING_BASE,
  headers: {
    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const delhiveryTrack = axios.create({
  baseURL: process.env.DELHIVERY_TRACK_BASE,
  headers: {
    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

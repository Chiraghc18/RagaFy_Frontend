// src/services/resourceService.js
import axios from "axios";

const API_BASE =  "https://ragafy-backend.onrender.com";

/**
 * Fetch all items for a resource (artists, heroes, movies...)
 * @param {string} resource - singular or plural? Use plural path: 'artists'
 */
export const fetchResource = (resource) => {
  return axios.get(`${API_BASE}/${resource}`);
};

/**
 * Upload a file + fields for the resource
 * @param {string} resource - e.g. 'artists'
 * @param {FormData} formData
 * @param {fn} onUploadProgress - percent callback (0-100)
 */
export const uploadResource = (resource, formData, onUploadProgress) => {
  return axios.post(`${API_BASE}/${resource}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (ev) => {
      if (!ev.total) return;
      const percent = Math.round((ev.loaded * 100) / ev.total);
      if (onUploadProgress) onUploadProgress(percent);
    },
  });
};

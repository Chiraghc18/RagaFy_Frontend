// src/pages/UploadResourcePage.jsx
import React from "react";
import GenericUpload from "../components/GenericUpload";

/**
 * Query param or route segment can be used to identify resource.
 * Here we'll expect a prop or route that passes resource name.
 *
 * Example usage in routes:
 *  <Route path="/artists" element={<UploadResourcePage resource="artists" title="Artists" />} />
 */
export default function UploadResourcePage({ resource = "artists", title }) {
  return <GenericUpload resource={resource} title={title || resource} />;
}

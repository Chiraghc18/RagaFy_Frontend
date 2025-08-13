// src/components/GenericUpload.jsx
import React, { useState, useRef, useEffect } from "react";
import ProgressBar from "./ProgressBar";
import { fetchResource, uploadResource } from "../services/resourceService";
import useUpload from "../hooks/useUpload"; // your existing hook

/**
 * Props:
 *  - resource: string (required) e.g. 'artists', 'heroes', 'movies'
 *  - title: string (optional) shown in header
 *  - fields: array of { name, type, placeholder } - currently supports text inputs
 *  - itemRenderer: optional function to render one item in the list
 */
export default function GenericUpload({
  resource,
  title,
  fields = [{ name: "name", type: "text", placeholder: "Name" }],
  itemRenderer,
}) {
  const [formValues, setFormValues] = useState(() =>
    fields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
  );
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const fileRef = useRef();

  // load items
  const loadItems = async () => {
    try {
      const res = await fetchResource(resource);
      setItems(res.data || []);
    } catch (err) {
      console.error(`Fetch ${resource} error:`, err);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line
  }, [resource]);

  // useUpload expects (formData) => uploadFunction
  const uploadFn = (formData, onProgress) => uploadResource(resource, formData, onProgress);
  const { progress, isUploading, handleUpload } = useUpload(uploadFn, loadItems);

  const onChangeField = (name, value) => setFormValues((s) => ({ ...s, [name]: value }));

  const onSubmit = (e) => {
    e.preventDefault();

    // basic validation: ensure required fields (non-empty) and file present
    const missing = fields.some((f) => f.required && !formValues[f.name]);
    if (missing || !file) {
      return alert("Please fill all required fields and select a file.");
    }

    const fd = new FormData();
    // append all fields
    fields.forEach((f) => fd.append(f.name, formValues[f.name]));
    // append file (form key: 'photo' expected by backend)
    fd.append("photo", file);

    handleUpload(fd);
    // reset local fields but wait for upload to finish to reset file UI
    setFormValues(fields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {}));
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{title || `Upload ${resource}`}</h2>

      <form onSubmit={onSubmit}>
        {fields.map((f) => (
          <div key={f.name} style={{ marginBottom: 8 }}>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={formValues[f.name] || ""}
              onChange={(e) => onChangeField(f.name, e.target.value)}
              required={!!f.required}
              style={{ padding: 8, width: 300 }}
            />
          </div>
        ))}

        <div style={{ margin: "8px 0" }}>
          <input
            ref={fileRef}
            type="file"
            accept={".png,.jpg,.jpeg,.webp,image/*"}
            onChange={(e) => setFile(e.target.files[0] || null)}
            disabled={isUploading}
          />
        </div>

        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <ProgressBar progress={progress} />
        {isUploading && progress === 100 && <p>Processing on server...</p>}
      </div>

      <h3 style={{ marginTop: 20 }}>{title ? `${title} List` : `${resource} List`}</h3>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {items.map((it) =>
          itemRenderer ? (
            <div key={it._id}>{itemRenderer(it)}</div>
          ) : (
            <div
              key={it._id}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                borderRadius: 6,
                textAlign: "center",
              }}
            >
              <img
                src={it.photo}
                alt={it.name}
                style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
              />
              <p>{it.name}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

import React from "react";
import { Upload } from "lucide-react";
import SmsImportButton from "./SmsImportButton";

const UploadModal = ({
  showUploadModal,
  setShowUploadModal,
  selectedFile,
  setSelectedFile,
  handleFileUpload,
  uploading,
  handleSmsImport,
  smsImporting
}) => {
  if (!showUploadModal) return null;

  return (
    <div className="upload-modal" onClick={() => (!uploading && !smsImporting ? setShowUploadModal(false) : null)}>
      <div className="upload-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="upload-header">Upload Bank Statement</h2>
        <div className="upload-zone" onClick={() => document.getElementById("fileInput").click()}>
          <input
            type="file"
            accept=".pdf,.csv,.xls,.xlsx"
            className="file-input-hidden"
            id="fileInput"
            onChange={(e) => setSelectedFile(e.target.files[0] || null)}
          />
          <div className="upload-icon">
            <Upload size={40} />
          </div>
          <div className="upload-text">Click to upload or drag & drop</div>
          <div className="upload-hint">Secure & encrypted</div>
          {selectedFile && (
            <div className="file-name-row">
              <span className="file-name">File: {selectedFile.name}</span>
            </div>
          )}
        </div>
        <div className="format-tags">
          <span className="format-tag">PDF</span>
          <span className="format-tag">CSV</span>
          <span className="format-tag">XLS</span>
          <span className="format-tag">XLSX</span>
        </div>
        <div className="action-buttons action-buttons-spaced">
          <SmsImportButton
            onClick={handleSmsImport}
            loading={smsImporting}
            disabled={uploading}
          />
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)} disabled={uploading || smsImporting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleFileUpload} disabled={uploading || smsImporting}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;

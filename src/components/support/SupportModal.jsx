import React, { useState } from 'react';
import { X } from 'lucide-react';
import SupportCenter from './SupportCenter';
import './SupportModal.css';

const SupportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="support-modal-overlay">
      <div className="support-modal-container">
        <div className="support-modal-header">
          <h2>Live Support Center</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="support-modal-body">
          <SupportCenter />
        </div>
      </div>
    </div>
  );
};

export default SupportModal;

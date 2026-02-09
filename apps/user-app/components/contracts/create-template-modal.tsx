'use client';

import { useState, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button } from '@repo/ui';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Annexure {
  id: string;
  name: string;
  type: 'Mandatory' | 'Editable';
}

interface OrgAccess {
  legal: boolean;
  sales: boolean;
  procurement: boolean;
  hr: boolean;
}

const categories = [
  'Legal & Compliance',
  'Sales & Commercial',
  'HR',
  'Procurement',
];

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTemplateModalProps) {
  const headingId = useId();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [annexures, setAnnexures] = useState<Annexure[]>([
    { id: '1', name: 'Standard Terms', type: 'Mandatory' },
    { id: '2', name: 'Pricing Schedule', type: 'Editable' },
  ]);
  const [orgAccess, setOrgAccess] = useState<OrgAccess>({
    legal: true,
    sales: true,
    procurement: false,
    hr: false,
  });

  // Auto-generate template code from name
  const templateCode = name
    ? `${name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}-Draft`
    : '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleAddAnnexure = () => {
    const newId = String(parseInt(annexures[annexures.length - 1].id) + 1);
    setAnnexures([
      ...annexures,
      { id: newId, name: 'New Annexure', type: 'Editable' },
    ]);
  };

  const handleRemoveAnnexure = (id: string) => {
    setAnnexures(annexures.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mock API call - just close modal and trigger success
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Reset form
    setName('');
    setCategory('');
    setAnnexures([
      { id: '1', name: 'Standard Terms', type: 'Mandatory' },
      { id: '2', name: 'Pricing Schedule', type: 'Editable' },
    ]);
    setOrgAccess({
      legal: true,
      sales: true,
      procurement: false,
      hr: false,
    });

    onSuccess?.();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 id={headingId} className="text-xl font-semibold text-neutral-900">
              Create Contract Template
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Define metadata, structure, and permissions for your new template
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column */}
              <div className="col-span-8 space-y-6">
                {/* Template Name & Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="template-name" className="block text-sm font-medium text-neutral-700 mb-2">
                      Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="template-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Standard NDA"
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="template-code" className="block text-sm font-medium text-neutral-700 mb-2">
                      Template Code
                    </label>
                    <div className="relative">
                      <input
                        id="template-code"
                        type="text"
                        value={templateCode}
                        readOnly
                        placeholder="Auto-generated"
                        className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500"
                      />
                      <MaterialIcon
                        name="lock"
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="template-category" className="block text-sm font-medium text-neutral-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="template-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload Part A Content */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Upload Part A Content
                  </label>
                  <div className="border-2 border-dashed border-indigo-200 rounded-lg p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer">
                    <MaterialIcon
                      name="cloud_upload"
                      size={40}
                      className="mx-auto text-indigo-600 mb-3"
                    />
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      Supported: .DOCX or Raw HTML (Max 10MB)
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Word
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        HTML5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-4 space-y-6">
                {/* Annexure Structure */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Annexure Structure
                  </label>
                  <div className="space-y-2 mb-3">
                    {annexures.map((annexure) => (
                      <div
                        key={annexure.id}
                        className="group flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                      >
                        <MaterialIcon
                          name="drag_indicator"
                          size={18}
                          className="text-neutral-400 cursor-grab"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-700 truncate">
                            {annexure.name}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {annexure.type}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnnexure(annexure.id)}
                          aria-label={`Remove ${annexure.name}`}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-opacity"
                        >
                          <MaterialIcon
                            name="delete"
                            size={16}
                            className="text-red-500"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAnnexure}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <MaterialIcon name="add" size={16} />
                    Add Annexure
                  </button>
                </div>

                {/* Org Access */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Organization Access
                  </label>
                  <div className="space-y-2">
                    {(Object.keys(orgAccess) as Array<keyof OrgAccess>).map((key) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={orgAccess[key]}
                          onChange={(e) =>
                            setOrgAccess({
                              ...orgAccess,
                              [key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-indigo-600 border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-neutral-700 capitalize">
                          {key === 'hr' ? 'HR' : key.charAt(0).toUpperCase() + key.slice(1)}
                          {key === 'legal' && ' Department'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 border-t border-neutral-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !category}>
              Create & Configure
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

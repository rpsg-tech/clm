"use client";

import { useState, useRef } from "react";
import { Button, Label, Checkbox, Spinner } from "@repo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

interface ContractUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contractId?: string;
    contractTitle?: string;
    onUploadComplete: (data: { key: string; filename: string; isFinal: boolean; fileSize: number }) => void;
}

export function ContractUploadDialog({
    isOpen,
    onClose,
    contractId,
    contractTitle,
    onUploadComplete
}: ContractUploadDialogProps) {
    const { success: showSuccess, error: showError } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isFinal, setIsFinal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleUploadClick = () => {
        if (!file) return;
        if (isFinal) {
            setShowConfirmDialog(true);
        } else {
            processUpload();
        }
    };

    const processUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(10);
        setShowConfirmDialog(false);

        try {
            let key = "";

            if (contractId) {
                // Option A: Upload to existing contract (creates new version immediately)
                setUploadProgress(30);
                const { uploadUrl, key: s3Key } = await api.contracts.getDocumentUploadUrl(
                    contractId,
                    file.name,
                    file.type
                );
                key = s3Key;

                setUploadProgress(50);
                await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type }
                });

                setUploadProgress(80);
                // Confirm & Create Version
                await api.contracts.confirmDocumentUpload(
                    contractId,
                    key,
                    file.name,
                    file.size,
                    isFinal
                );
            } else {
                // Option B: New Contract Flow (No ID yet)
                setUploadProgress(100);
            }

            setUploadProgress(100);
            showSuccess("Upload Successful", isFinal ? "Contract is now Active." : "Document selected.");

            setTimeout(() => {
                onUploadComplete({ key, filename: file.name, isFinal, fileSize: file.size });
                handleClose();
            }, 500);

        } catch (err: any) {
            console.error(err);
            showError("Upload Failed", err.message || "Something went wrong");
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleClose = () => {
        setFile(null);
        setIsFinal(false);
        setIsUploading(false);
        setUploadProgress(0);
        setShowConfirmDialog(false);
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Upload Contract Document</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* File Dropzone */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
                                file ? "border-orange-200 bg-orange-50/50" : "border-slate-200 hover:border-orange-400 hover:bg-slate-50",
                                isUploading && "cursor-not-allowed opacity-80"
                            )}
                        >
                            {isUploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Spinner size="lg" className="text-orange-600" />
                                        <p className="text-sm font-medium text-orange-700">{uploadProgress}% Uploaded</p>
                                    </div>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx"
                                disabled={isUploading}
                            />

                            {file ? (
                                <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-3">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium text-slate-900 truncate max-w-[300px]">{file.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    {!isUploading && (
                                        <Button variant="ghost" size="sm" className="mt-2 h-8 text-orange-600 hover:text-orange-700" onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}>
                                            Change File
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium text-slate-900">Click to upload or drag & drop</p>
                                    <p className="text-xs text-slate-500 mt-1">PDF, Word, or Scanned Images</p>
                                </div>
                            )}
                        </div>

                        {/* Final Copy Checkbox */}
                        <div className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border transition-all duration-300",
                            isFinal ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-100"
                        )}>
                            <Checkbox
                                id="final-copy"
                                checked={isFinal}
                                onCheckedChange={(c) => setIsFinal(c as boolean)}
                                disabled={isUploading}
                                className={cn("mt-1", isFinal && "bg-green-600 border-green-600")}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label
                                    htmlFor="final-copy"
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    Mark as Final Signed & Approved Copy
                                </Label>
                                <p className="text-[11px] text-slate-500">
                                    Checking this will set the contract status to <span className={cn("font-bold transition-colors", isFinal ? "text-green-600" : "text-slate-700")}>ACTIVE</span> and lock further editing.
                                </p>
                            </div>
                            {isFinal && <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto animate-in fade-in" />}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUploadClick}
                            disabled={!file || isUploading}
                            className={cn(
                                "min-w-[100px] transition-colors",
                                isFinal ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"
                            )}
                        >
                            {isUploading ? "Processing..." : (isFinal ? "Upload & Activate" : "Upload")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            ⚠️ Confirm Final Activation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-slate-600 text-sm space-y-3">
                        <p>Are you sure you want to mark this document as the <strong>Final Signed Copy</strong>?</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>The contract status will change to <strong>ACTIVE</strong>.</li>
                            <li>Editing will be <strong>LOCKED</strong>.</li>
                            <li>This version will be treated as the source of truth.</li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={processUpload}>
                            Yes, Activate Contract
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

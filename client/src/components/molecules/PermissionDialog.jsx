import React from 'react';
import { X, Lock, Settings } from 'lucide-react';

const PermissionDialog = ({ isOpen, onClose, title, message, onRetry }) => {
    if (!isOpen) return null;

    console.log("Rendering PermissionDialog", { title, message }); // Debug log

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-white">{title || "Permission Required"}</h3>

                    <div className="text-zinc-300 text-sm leading-relaxed space-y-4">
                        <p>{message}</p>

                        {/* Instructional Graphic / Hint */}
                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-yellow-500 font-semibold mb-1">
                                <Lock size={16} /> <span>How to enable:</span>
                            </div>
                            <p className="text-xs text-zinc-400">
                                Click the <strong>Lock icon 🔒</strong> in your browser's address bar (top left), then find <strong>Camera/Microphone</strong> and select <strong>"Allow"</strong> or toggle the switch on.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-700/50">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
                        >
                            Continue not allowing
                        </button>
                        {onRetry && (
                            <button
                                onClick={() => { onClose(); onRetry(); }}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                Allow this time
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionDialog;

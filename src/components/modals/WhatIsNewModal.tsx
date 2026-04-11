import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface WhatIsNewModalProps {
  version: string;
  notes: string;
  forceOpen?: boolean;
  onClose?: () => void;
}

export function WhatIsNewModal({ version, notes, forceOpen, onClose }: WhatIsNewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (!version) return;

    const currentMajor = version.split('.')[0];
    const lastSeenVersion = localStorage.getItem('canix_last_seen_version');
    const lastSeenMajor = lastSeenVersion?.split('.')[0];

    // Mostra se for uma mudança de versão MAJOR ou se nunca viu nada e temos notas
    if (lastSeenMajor && currentMajor > lastSeenMajor) {
      setIsOpen(true);
    } 
    else if (!lastSeenVersion && notes) {
      setIsOpen(true);
    }
  }, [version, forceOpen, notes]);

  const handleClose = () => {
    if (!forceOpen) {
      localStorage.setItem('canix_last_seen_version', version);
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent hideClose className="p-0 border-none bg-transparent shadow-none max-w-[480px] focus:outline-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full bg-gradient-to-br from-[#141B2B] to-[#1E293B] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden p-10 border border-white/10"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap size={120} />
          </div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <Badge className="bg-[#2F7FD3] text-white border-none font-black tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full">
                NOVIDADE NO CANIX
              </Badge>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="text-3xl font-black tracking-tighter mb-4 italic">
              O sistema evoluiu para a v{version}!
            </h2>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/5 mb-8">
              <p className="text-blue-200/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {notes || "Esta nova versão traz grandes melhorias de performance e novas funcionalidades para o seu petshop."}
              </p>
            </div>

            <Button 
              onClick={handleClose}
              className="w-full h-14 rounded-2xl bg-white text-black hover:bg-blue-50 font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-white/5"
            >
              Vamos explorar as novidades →
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

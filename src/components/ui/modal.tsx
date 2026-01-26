"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/* ============================================
   MODAL COMPONENT
   Using @radix-ui/react-dialog
   ============================================ */

const Modal = DialogPrimitive.Root;

const ModalTrigger = DialogPrimitive.Trigger;

const ModalPortal = DialogPrimitive.Portal;

const ModalClose = DialogPrimitive.Close;

/* ----------------------------------------
   Modal Overlay
   ---------------------------------------- */
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`
      fixed inset-0 z-50
      bg-black/60 backdrop-blur-sm
      data-[state=open]:animate-fade-in
      data-[state=closed]:animate-fade-out
      ${className}
    `.trim()}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

/* ----------------------------------------
   Modal Content
   ---------------------------------------- */
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(({ className = "", children, showCloseButton = true, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={`
        fixed left-1/2 top-1/2 z-50
        w-full max-w-lg -translate-x-1/2 -translate-y-1/2
        rounded-xl border border-sub
        bg-bg p-6 shadow-xl
        data-[state=open]:animate-modal-in
        data-[state=closed]:animate-modal-out
        focus:outline-none
        ${className}
      `.trim()}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          className="
            absolute right-4 top-4
            rounded-sm p-1
            text-sub transition-colors
            hover:text-main
            focus:outline-none focus-visible:ring-2 focus-visible:ring-main
            disabled:pointer-events-none
          "
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </ModalPortal>
));
ModalContent.displayName = DialogPrimitive.Content.displayName;

/* ----------------------------------------
   Modal Header
   ---------------------------------------- */
const ModalHeader = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`
      flex flex-col space-y-1.5 text-center sm:text-left
      ${className}
    `.trim()}
    {...props}
  />
);
ModalHeader.displayName = "ModalHeader";

/* ----------------------------------------
   Modal Footer
   ---------------------------------------- */
const ModalFooter = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`
      flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end
      ${className}
    `.trim()}
    {...props}
  />
);
ModalFooter.displayName = "ModalFooter";

/* ----------------------------------------
   Modal Title
   ---------------------------------------- */
const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={`
      text-lg font-semibold leading-none tracking-tight text-text
      ${className}
    `.trim()}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

/* ----------------------------------------
   Modal Description
   ---------------------------------------- */
const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={`
      text-sm text-sub
      ${className}
    `.trim()}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

/* ============================================
   CSS for animations (add to globals.css)

   @keyframes modal-in {
     from {
       opacity: 0;
       transform: translate(-50%, -48%) scale(0.96);
     }
     to {
       opacity: 1;
       transform: translate(-50%, -50%) scale(1);
     }
   }

   @keyframes modal-out {
     from {
       opacity: 1;
       transform: translate(-50%, -50%) scale(1);
     }
     to {
       opacity: 0;
       transform: translate(-50%, -48%) scale(0.96);
     }
   }

   @keyframes fade-out {
     from { opacity: 1; }
     to { opacity: 0; }
   }

   .animate-modal-in {
     animation: modal-in 0.2s ease-out;
   }

   .animate-modal-out {
     animation: modal-out 0.15s ease-in;
   }

   .animate-fade-out {
     animation: fade-out 0.15s ease-in;
   }
   ============================================ */

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
};

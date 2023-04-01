import { Dialog, Transition } from "@headlessui/react";
import type { ComponentProps, ReactNode } from "react";

export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex items-center justify-between">{children}</div>
  );
}

export function ModalBody({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2">
      <p className="text-gray-500 text-sm">{children}</p>
    </div>
  );
}

export function ModalTitle({
  children,
  as = "h3",
  ...props
}: Omit<ComponentProps<typeof Dialog.Title>, "className">) {
  return (
    <Dialog.Title
      as={as}
      className="text-gray-900 text-lg font-medium leading-6"
      {...props}
    >
      {children}
    </Dialog.Title>
  );
}

export function ModalContent({
  children,
  ...props
}: Omit<ComponentProps<typeof Dialog.Panel>, "className">) {
  return (
    <Dialog.Panel
      className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
      {...props}
    >
      {children}
    </Dialog.Panel>
  );
}

export function Modal({
  children,
  onClose,
  visible,
}: {
  children: ReactNode;
  onClose: () => void;
  visible: boolean;
}) {
  return (
    <Transition show={visible}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {children}
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

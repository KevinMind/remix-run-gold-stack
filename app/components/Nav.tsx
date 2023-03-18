import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext, useState, useMemo } from "react";
import { NavLink as RemixNavLink } from "@remix-run/react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface NavContextType {
  open: boolean;
  toggle: (state?: boolean) => void;
}
const NavContext = createContext<NavContextType>({
  open: false,
  toggle: () => {},
});

export function NavProvider({
  children,
  defaultState = false,
}: {
  children: ReactNode;
  defaultState?: boolean;
}) {
  const [open, setOpen] = useState(defaultState);

  const value = useMemo(
    () => ({
      open,
      toggle: (state?: boolean) =>
        setOpen((prev) => {
          if (typeof state === "boolean") {
            return state;
          }
          return !prev;
        }),
    }),
    [open]
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

function useNavState() {
  const context = useContext(NavContext);

  if (!context)
    throw new Error("must call useNavState() in child of NavProvider");

  return context;
}

export function NavState({
  children,
}: {
  children: (state: NavContextType) => ReactNode;
}) {
  const navState = useNavState();

  return <>{children(navState)}</>;
}

export function NavText({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function NavIcon({ children }: { children: ReactNode }) {
  return <div className=" w-2xl h-2xl fill-black">{children}</div>;
}

export function NavRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  const { toggle } = useNavState();

  function handleClick() {
    toggle(false);
    onClick?.();
  }

  return (
    <div
      className="flex items-center  justify-between border-b-2 border-solid border-black py-10 px-4 text-5xl"
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

export function NavLink({
  onClick,
  ...props
}: ComponentProps<typeof RemixNavLink>) {
  const { toggle } = useNavState();

  return (
    <RemixNavLink
      {...props}
      onClick={(event) => {
        toggle(false);
        onClick?.(event);
      }}
    />
  );
}

interface NavItemProps {
  children: ReactNode;
  visible?: boolean;
}

export function NavItem({ children, visible = true }: NavItemProps) {
  if (!visible) {
    return null;
  }

  return <>{children}</>;
}

export function Nav({ children }: { children: ReactNode }) {
  const { open, toggle } = useNavState();

  function onClose() {
    toggle(false);
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                      <button
                        type="button"
                        className="rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6"></div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

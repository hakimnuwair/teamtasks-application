import { create } from "zustand";

type ModalType =
  | "createReminder"
  | "editReminder"
  | "createGroup"
  | "inviteMember"
  | null;

interface UIState {
  sidebarOpen: boolean;
  activeModal: ModalType;
  modalData: unknown; // data passed to the open modal (e.g., reminder to edit)
  isDarkMode: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modal: ModalType, data?: unknown) => void;
  closeModal: () => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  modalData: null,
  isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modal, data = null) =>
    set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.isDarkMode;
      document.documentElement.classList.toggle("dark", next);
      return { isDarkMode: next };
    }),
}));

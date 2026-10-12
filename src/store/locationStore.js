import { create } from "zustand"
import { persist } from "zustand/middleware"
import { addRecent } from "@/features/location/recent"

export const useLocationStore = create(
  persist(
    (set) => ({
      location: null, // the chosen zone, for example { id, name, slug, city }
      recents: [], // last 3, newest first (visitors, and a fallback for customers)
      pickerOpen: false,
      openPicker: () => set({ pickerOpen: true }),
      closePicker: () => set({ pickerOpen: false }),
      setLocation: (zone) => set((s) => ({ location: zone, recents: addRecent(s.recents, zone) })),
    }),
    {
      name: "servana_location",
      partialize: (s) => ({ location: s.location, recents: s.recents }),
    },
  ),
)

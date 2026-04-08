import { create } from "zustand";

interface CelebrationState {
  burstKey: number;
  visible: boolean;
  triggerBurst: () => void;
  hideBurst: () => void;
}

export const useCelebrationStore = create<CelebrationState>((set) => ({
  burstKey: 0,
  visible: false,
  triggerBurst: () =>
    set((state) => ({
      visible: true,
      burstKey: state.burstKey + 1,
    })),
  hideBurst: () => set({ visible: false }),
}));

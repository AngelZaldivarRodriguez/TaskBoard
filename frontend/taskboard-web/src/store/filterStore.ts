import { create } from 'zustand'

interface FilterState {
  search: string
  priority: string
  assigneeId: string
  setSearch: (v: string) => void
  setPriority: (v: string) => void
  setAssigneeId: (v: string) => void
  reset: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  search: '',
  priority: '',
  assigneeId: '',
  setSearch: (search) => set({ search }),
  setPriority: (priority) => set({ priority }),
  setAssigneeId: (assigneeId) => set({ assigneeId }),
  reset: () => set({ search: '', priority: '', assigneeId: '' }),
}))

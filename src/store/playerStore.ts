import { create } from 'zustand'

export interface Song {
  id: string
  title: string
  artist: string
  album?: string | null
  genre?: string | null
  year?: string | null
  lyrics?: string | null
  duration: number
  fileUrl: string
  coverUrl?: string | null
  plays: number
}

interface PlayerState {
  queue: Song[]
  currentIndex: number
  isPlaying: boolean
  volume: number
  progress: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'

  setQueue: (songs: Song[], startIndex?: number) => void
  playSong: (song: Song) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  setVolume: (v: number) => void
  setProgress: (p: number) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  shuffle: false,
  repeat: 'none',

  setQueue: (songs, startIndex = 0) =>
    set({ queue: songs, currentIndex: startIndex, isPlaying: true }),

  playSong: (song) => {
    const { queue } = get()
    const idx = queue.findIndex((s) => s.id === song.id)
    if (idx !== -1) {
      set({ currentIndex: idx, isPlaying: true })
    } else {
      set({ queue: [song, ...queue], currentIndex: 0, isPlaying: true })
    }
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, currentIndex, shuffle, repeat } = get()
    if (queue.length === 0) return
    if (shuffle) {
      const next = Math.floor(Math.random() * queue.length)
      set({ currentIndex: next, isPlaying: true })
    } else if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true })
    } else if (repeat === 'all') {
      set({ currentIndex: 0, isPlaying: true })
    }
  },

  prev: () => {
    const { currentIndex, progress } = get()
    if (progress > 3) {
      set({ progress: 0 })
    } else if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true })
    }
  },

  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({
      repeat:
        s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none',
    })),
}))

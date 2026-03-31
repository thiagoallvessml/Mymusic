import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  
  favorites: string[]
  history: string[]
  playlists: { id: string; name: string; songIds: string[] }[]
  toggleFavorite: (id: string) => void
  addToHistory: (id: string) => void
  createPlaylist: (name: string) => void
  deletePlaylist: (id: string) => void
  addSongToPlaylist: (playlistId: string, songId: string) => void
  removeSongFromPlaylist: (playlistId: string, songId: string) => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      volume: 0.8,
      progress: 0,
      shuffle: false,
      repeat: 'none',
      favorites: [],
      history: [],
      playlists: [],

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
    
  toggleFavorite: (id) => set((s) => ({
    favorites: s.favorites.includes(id) 
      ? s.favorites.filter(x => x !== id) 
      : [...s.favorites, id]
  })),
  
  addToHistory: (id: string) => {
    set((state) => {
      const hist = state.history.filter(sId => sId !== id)
      hist.unshift(id)
      if (hist.length > 100) hist.pop()
      return { history: hist }
    })
  },

  createPlaylist: (name: string) => {
    set((state) => ({
      playlists: [...state.playlists, { id: Date.now().toString(), name, songIds: [] }]
    }))
  },

  deletePlaylist: (id: string) => {
    set((state) => ({
      playlists: state.playlists.filter(p => p.id !== id)
    }))
  },

  addSongToPlaylist: (playlistId: string, songId: string) => {
    set((state) => ({
      playlists: state.playlists.map(p => 
        p.id === playlistId 
          ? { ...p, songIds: p.songIds.includes(songId) ? p.songIds : [...p.songIds, songId] }
          : p
      )
    }))
  },

  removeSongFromPlaylist: (playlistId: string, songId: string) => {
    set((state) => ({
      playlists: state.playlists.map(p => 
        p.id === playlistId 
          ? { ...p, songIds: p.songIds.filter(id => id !== songId) }
          : p
      )
    }))
  }
    }),
    {
      name: 'mymusic-player-storage',
      partialize: (state) => ({ 
        volume: state.volume, 
        favorites: state.favorites, 
        history: state.history,
        playlists: state.playlists
      }) // Only persist these
    }
  )
)

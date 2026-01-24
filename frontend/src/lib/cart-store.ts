'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  restaurantId: string
  restaurantName: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(i => i.menuItemId === item.menuItemId)
          
          if (existingItem) {
            return {
              items: state.items.map(i =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          
          return {
            items: [...state.items, { ...item, quantity: 1, id: Date.now().toString() }],
          }
        })
      },
      
      removeItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter(i => i.menuItemId !== menuItemId),
        }))
      },
      
      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
          return
        }
        
        set((state) => ({
          items: state.items.map(i =>
            i.menuItemId === menuItemId
              ? { ...i, quantity }
              : i
          ),
        }))
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

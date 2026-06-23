import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  total: 0,
  subtotal: 0,
  cupon: null,
  clearCart: () => set({ cart: [], total: 0, subtotal: 0 }),

  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch cart items",
      );
    }
  },

  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product._id });

      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item._id === product._id,
        );

        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [...prevState.cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });
      get().calculateTotals();
      toast.success("Item added to cart");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to add item to cart",
      );
    }
  },

  calculateTotals: () => {
    const { cart, cupon } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (cupon) {
      const discount = (cupon.discount / 100) * subtotal;
      const total = subtotal - discount;
      set({ subtotal, total });
    } else {
      set({ subtotal, total: subtotal });
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete(`/cart`, { data: { productId } });
      set((prevState) => ({
        cart: prevState.cart.filter((item) => item._id !== productId),
      }));
      get().calculateTotals();
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to remove item from cart",
      );
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity < 1) {
      get().removeFromCart(productId);
      return;
    }

    try {
      await axios.put(`/cart`, { productId, quantity });
      set((prevState) => ({
        cart: prevState.cart.map((item) =>
          item._id === productId ? { ...item, quantity } : item,
        ),
      }));
      get().calculateTotals();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update item quantity",
      );
    }
  },
}));

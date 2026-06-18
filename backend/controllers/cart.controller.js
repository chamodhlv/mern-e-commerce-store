import Product from "../models/Product.model.js";

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user.cart.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ id: productId, quantity: 1 });
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCartProducts = async (req, res) => {
  try {
    const product = await Product.find({ _id: { $in: req.user.cartItems } });

    const cartProducts = product.map((prod) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.id === prod.id,
      );
      return {
        ...prod.toJson(),
        quantity: item.quantity,
      };
    });
    res.json(cartProducts);
  } catch (error) {
    console.error("Error fetching cart products:", error);
    res.status(500).json({ message: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    if (!productId) {
      req.user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    const existingItem = user.cartItems.find((item) => item.id === productId);

    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter((item) => item.id !== productId);
        await user.save();
        return res.json(user.cartItems);
      }

      existingItem.quantity = quantity;
      await user.save();
      res.json(user.cartItems);
    } else {
      res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ message: error.message });
  }
};

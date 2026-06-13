import Product from "../models/Product.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json({ products: JSON.parse(featuredProducts) });
    }

    featuredProducts = await Product.find({ isFeatured: true }).lean();
    //.lean() is used to return plain JavaScript objects instead of Mongoose documents, which can improve performance when you don't need the full functionality of Mongoose documents.

    if (!featuredProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }

    //store in redis for future quick access

    await redis.set(
      "featured_products",
      JSON.stringify(featuredProducts),
      "EX",
      3600,
    ); // Cache for 1 hour

    res.json({ products: featuredProducts });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, isFeatured } = req.body;

    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      isFeatured,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
    });

    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      const publicId = product.image.split("/").slice(-1)[0].split(".")[0]; // Extract public ID from URL

      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Image deleted from Cloudinary");
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

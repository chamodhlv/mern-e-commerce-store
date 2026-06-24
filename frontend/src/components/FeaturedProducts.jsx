import React from "react";
import { useState } from "react";

const FeaturedProducts = ({ featuredProducts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemPerPage, setItemPerPage] = useState(4);

  return <div>FeaturedProducts</div>;
};

export default FeaturedProducts;

import React from "react";
import { Link } from "react-router-dom";
import { Rating } from "@mui/material";
import { motion } from "framer-motion";

const ProductCard = ({ product }) => {
  const options = {
    value: product.ratings,
    readOnly: true,
    precision: 0.5,
  };

  return (
    <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ y: -5, boxShadow: "8px 8px 0px var(--color-primary)" }}
        style={{
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ position: 'relative', width: '100%', paddingTop: '100%', overflow: 'hidden', marginBottom: '16px', background: '#000' }}>
            <img
              src={product.images[0].url}
              alt={product.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'grayscale(100%) contrast(1.2)',
                transition: 'filter 0.3s ease'
              }}
              onMouseOver={e => e.currentTarget.style.filter = 'none'}
              onMouseOut={e => e.currentTarget.style.filter = 'grayscale(100%) contrast(1.2)'}
            />
        </div>

        <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.2rem',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--color-text)'
        }}>
            {product.name}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Rating {...options} size="small" sx={{
                    "& .MuiRating-iconFilled": { color: "var(--color-primary)" },
                    "& .MuiRating-iconEmpty": { color: "#333" }
                }} />
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                    ({product.numOfReviews})
                </span>
            </div>
            <span style={{
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem'
            }}>
                {`₹${product.price}`}
            </span>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;

import React from "react";
import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.div className="nav-bar" 
    initial={{y: -250}}
    animate={{y:0}}
    transition={{
      duration: 2
    }}
    >
      {/* <div className="logo">logo</div> */}
      <div className="nav-links">
        <a href="">Home</a>
        <a href="">Review</a>
        <a href="">About</a>
        <a href="">Contact</a>
      </div>
    </motion.div>
  );
}

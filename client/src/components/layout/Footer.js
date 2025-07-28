import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-secondary-color text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-color rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="text-xl font-display font-bold">Elegant Jewelry</span>
            </div>
            <p className="text-gray-300 mb-4">
              Discover the finest collection of premium jewelry. From elegant rings to stunning necklaces, 
              we offer timeless pieces that tell your unique story.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                <FiFacebook className="text-xl" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                <FiTwitter className="text-xl" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                <FiInstagram className="text-xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-primary-color transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-300 hover:text-primary-color transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/shop?category=rings" className="text-gray-300 hover:text-primary-color transition-colors">
                  Rings
                </Link>
              </li>
              <li>
                <Link to="/shop?category=necklaces" className="text-gray-300 hover:text-primary-color transition-colors">
                  Necklaces
                </Link>
              </li>
              <li>
                <Link to="/shop?category=earrings" className="text-gray-300 hover:text-primary-color transition-colors">
                  Earrings
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-primary-color transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-300 hover:text-primary-color transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                  Size Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiMapPin className="text-primary-color" />
                <span className="text-gray-300">
                  123 Jewelry Street<br />
                  New York, NY 10001
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <FiPhone className="text-primary-color" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiMail className="text-primary-color" />
                <span className="text-gray-300">info@elegantjewelry.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-sm mb-4 md:mb-0">
              © 2024 Elegant Jewelry. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-300 hover:text-primary-color transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
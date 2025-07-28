import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

// Create context
const CartContext = createContext();

// Action types
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CART: 'SET_CART',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  isLoading: false,
  error: null,
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload.items || [],
        totalAmount: action.payload.totalAmount || 0,
        totalItems: action.payload.totalItems || 0,
        isLoading: false,
        error: null,
      };
    case CART_ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: action.payload.items,
        totalAmount: action.payload.totalAmount,
        totalItems: action.payload.totalItems,
        error: null,
      };
    case CART_ACTIONS.UPDATE_ITEM:
      return {
        ...state,
        items: action.payload.items,
        totalAmount: action.payload.totalAmount,
        totalItems: action.payload.totalItems,
        error: null,
      };
    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: action.payload.items,
        totalAmount: action.payload.totalAmount,
        totalItems: action.payload.totalItems,
        error: null,
      };
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        totalAmount: 0,
        totalItems: 0,
        error: null,
      };
    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case CART_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      // Clear cart when user logs out
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
    }
  }, [isAuthenticated, user]);

  // Cart actions
  const loadCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      const response = await axios.get('/api/cart');
      dispatch({
        type: CART_ACTIONS.SET_CART,
        payload: response.data,
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: 'Failed to load cart',
      });
    }
  };

  const addToCart = async (productId, quantity = 1, size = '', customization = {}) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please login to add items to cart');
        return;
      }

      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: CART_ACTIONS.CLEAR_ERROR });

      const response = await axios.post('/api/cart/add', {
        productId,
        quantity,
        size,
        customization,
      });

      dispatch({
        type: CART_ACTIONS.ADD_ITEM,
        payload: response.data.cart,
      });

      toast.success('Item added to cart!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add item to cart';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: message,
      });
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const updateItemQuantity = async (itemId, quantity) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: CART_ACTIONS.CLEAR_ERROR });

      const response = await axios.put(`/api/cart/update/${itemId}`, {
        quantity,
      });

      dispatch({
        type: CART_ACTIONS.UPDATE_ITEM,
        payload: response.data.cart,
      });

      if (quantity === 0) {
        toast.success('Item removed from cart');
      } else {
        toast.success('Cart updated');
      }
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update cart';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: message,
      });
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: CART_ACTIONS.CLEAR_ERROR });

      const response = await axios.delete(`/api/cart/remove/${itemId}`);

      dispatch({
        type: CART_ACTIONS.REMOVE_ITEM,
        payload: response.data.cart,
      });

      toast.success('Item removed from cart');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove item';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: message,
      });
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      await axios.delete('/api/cart/clear');

      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      toast.success('Cart cleared');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: message,
      });
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const validateCart = async () => {
    try {
      const response = await axios.post('/api/cart/validate');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Cart validation failed';
      throw new Error(message);
    }
  };

  const getCartCount = async () => {
    try {
      const response = await axios.get('/api/cart/count');
      return response.data.count;
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  };

  // Helper functions
  const getItemTotal = (item) => {
    return item.priceAtTime * item.quantity;
  };

  const isItemInCart = (productId, size = '', customization = {}) => {
    return state.items.some(item =>
      item.product._id === productId &&
      item.size === size &&
      JSON.stringify(item.customization) === JSON.stringify(customization)
    );
  };

  const getItemQuantity = (productId, size = '', customization = {}) => {
    const item = state.items.find(item =>
      item.product._id === productId &&
      item.size === size &&
      JSON.stringify(item.customization) === JSON.stringify(customization)
    );
    return item ? item.quantity : 0;
  };

  const clearError = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    clearCart,
    validateCart,
    getCartCount,
    loadCart,
    getItemTotal,
    isItemInCart,
    getItemQuantity,
    clearError,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
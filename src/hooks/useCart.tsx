import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

const recoverCart = (): Product[] => {
  const storagedCart = localStorage.getItem('@RocketShoes:cart');

  if (storagedCart) {
    return JSON.parse(storagedCart);
  }

  return [];
}

const persistCart = (cart: Product[]) => {
  localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
};

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = recoverCart();

    return storagedCart;
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      const product = response.data as Product;

      if (product.amount === 0) {
        throw new Error('Product out of stock');
      }

      
      setCart((previousCart) => {
        const isProductAlreadyInCartIndex = previousCart.findIndex(product => product.id === productId);
        
        const isNewProduct = isProductAlreadyInCartIndex >= 0;
        
        if (isNewProduct) {
          const newCart =  previousCart.concat(product);
          persistCart(newCart);
         return newCart;
        } else  {
          previousCart[isProductAlreadyInCartIndex].amount += 1;
          persistCart(previousCart);
          return previousCart;
        }      

      });

      toast.success('Product added to cart');
    } catch (error: any) {
      if (error.message === 'Product out of stock') {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Ocorreu um problema ao adicionar o produto no carrinho');

      }
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      // localStorage.setItem('@RocketShoes:cart', cart)
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      // localStorage.setItem('@RocketShoes:cart', cart)
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

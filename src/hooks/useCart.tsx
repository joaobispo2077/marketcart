import axios from 'axios';
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

      const stockProduct = response.data as Stock;

      if (stockProduct.amount === 0) {
        throw new Error('Product out of stock');
      }

      // await api.patch(`/stock/${productId}`, { amount: stockProduct.amount - 1 });

      const responseProduct = await api.get(`/products/${productId}`);
      const product = responseProduct.data as Product;

      console.log(stockProduct);
      setCart((previousCart) => {
        const isProductAlreadyInCartIndex = cart.findIndex(product => product.id === productId);
        
        const isNewProduct = isProductAlreadyInCartIndex === -1;
        
        if (isNewProduct) {
          const newProductWithInitialAmount = Object.assign(product, {
            amount: 1,
          });

          const newCart =  previousCart.concat(newProductWithInitialAmount);

          persistCart(newCart);
          return newCart;
        } else  {
          previousCart[isProductAlreadyInCartIndex].amount += 1;
          const newCart = [...previousCart];

          persistCart(newCart);
          return newCart;
        }      

      });

      toast.success('Product added to cart');
    } catch (error: any) {
      if (error.message === 'Product out of stock') {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro na adição do produto');
      }

    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart((previousCart) => {
        const newCart = previousCart.filter(product => product.id !== productId);

        persistCart(newCart);
        return newCart;
      });

      toast.success('Product removed from cart');      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        return;
      }

      const response = await api.get(`/stock/${productId}`);

      const stockProduct = response.data as Stock;

      if (stockProduct.amount < amount) {
        throw new Error('Product out of stock');
      }

      setCart((previousCart) => {
        const productIndex = cart.findIndex(product => product.id === productId);
        
        previousCart[productIndex].amount = amount;
        const newCart = [...previousCart];

        persistCart(newCart);
        return newCart;
      });

    } catch (error: any){
      if (error.message === 'Product out of stock') {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
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

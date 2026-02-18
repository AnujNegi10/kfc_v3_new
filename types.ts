
export type Category =
  | 'All'
  | 'Burger'
  | 'Grill'
  | 'epic_saver'
  | 'Add-on'
  | 'Rice Bowlz'
  | 'Meal'
  | 'Snacks'
  | 'Dips'
  | 'Roll'
  | 'Desserts'
  | 'Bucket'
  | 'Beverages'
  | 'Combo';

export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  type: string; // 'veg' or 'non-veg'
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AppState {
  cart: CartItem[];
  currentCategory: Category;
  isCartOpen: boolean;
  isVoiceActive: boolean;
}


import { Product } from './types';

export const MENU_ITEMS: Product[] = [
  {
    id: 'z0',
    name: 'Mighty Zinger Burger',
    description: 'The King of Zingers. Double crispy chicken fillets, cheese, and spicy mayo.',
    price: 329,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80',
    isVeg: false
  },
  {
    id: 'z1',
    name: 'Classic Zinger Burger',
    description: 'Signature spicy chicken burger with fresh lettuce and mayo.',
    price: 199,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=400&q=80',
    isVeg: false
  },
  {
    id: 'z2',
    name: 'Veg Zinger Burger',
    description: 'Crispy veg patty with fresh lettuce and signature mayo.',
    price: 179,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
    isVeg: true
  },
  {
    id: 'z3',
    name: 'Veg Pasta Burger',
    description: 'Crispy veg patty with fresh lettuce and signature mayo.',
    price: 179,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
    isVeg: true
  },
  {
    id: 'z4',
    name: 'Tandoori Mac Burger',
    description: 'Crispy veg patty with fresh lettuce and signature mayo.',
    price: 179,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
    isVeg: true
  },
  {
    id: 'c1',
    name: '2pc Hot & Spicy Chicken',
    description: 'Signature KFC crunchy chicken pieces.',
    price: 249,
    category: 'Chicken',
    image: 'https://images.unsplash.com/photo-1562967914-6c82c3f8a47c?w=400&q=80',
    isVeg: false
  },
  {
    id: 'b1',
    name: 'Chicken Biryani Bucket',
    description: 'Hyderabadi style Biryani with 2 pcs of Hot & Spicy chicken.',
    price: 449,
    category: 'Buckets',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80',
    isVeg: false
  },
  {
    id: 'b2',
    name: 'Peri Peri Match Box',
    description: '5pc Hot Wings with Peri Peri seasoning.',
    price: 299,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80',
    isVeg: false
  },
  {
    id: 's1',
    name: 'Peri Peri Fries (Large)',
    description: 'Crispy fries tossed in spicy peri peri mix.',
    price: 149,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1573082818143-2410b742555f?w=400&q=80',
    isVeg: true
  },
  {
    id: 'v1',
    name: 'Pepsi Black 500ml',
    description: 'Refreshing cola with zero sugar.',
    price: 60,
    category: 'Beverages',
    image: 'https://images.ctfassets.net/wtodlh47qxpt/7v0X1ta7j6fLS0ek4m3f3/9f542c584a588979cc70cec94c0a414d/KFC_takeaway-PLP_380x285_25-nov_pepsi.jpg?h=600&w=800&fm=webp&fit=fill',
    isVeg: true
  },
  {
    id: 'co1',
    name: 'Stay Home Bucket',
    description: '4pc Hot & Spicy, 4pc Wings, 2 Large Fries.',
    price: 799,
    category: 'Buckets',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
    isVeg: false
  },
  {
    id: 'co2',
    name: 'Epic Saver Combo',
    description: '1 Zinger, 1pc Hot & Spicy, 1 Medium Fries & Pepsi.',
    price: 299,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80',
    isVeg: false
  }
];

export const CATEGORIES: string[] = ["All", "Burger", "Grill", "epic_saver", "Add-on", "Rice Bowlz", "Meal", "Snacks", "Dips", "Roll", "Desserts", "Bucket", "Beverages", "Combo"];

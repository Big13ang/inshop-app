export type ParentIconName =
  | 'Shirt'
  | 'Gem'
  | 'Smartphone'
  | 'Sparkles'
  | 'Home'
  | 'ShoppingBag'
  | 'BookOpen'
  | 'Wrench'
  | 'Dumbbell'
  | 'Baby';

export type SubIconName =
  | 'Armchair' | 'Baby' | 'Bed' | 'Bike' | 'BookOpen' | 'Boxes' | 'Camera' | 'Car'
  | 'CircleDot' | 'Coffee' | 'Coins' | 'Compass' | 'Cookie' | 'Crown' | 'Droplets'
  | 'Dumbbell' | 'Flame' | 'Footprints' | 'Gem' | 'Glasses' | 'Hammer' | 'Headphones'
  | 'Keyboard' | 'Lamp' | 'Laptop' | 'Luggage' | 'Milk' | 'Package' | 'Palette' | 'PenTool'
  | 'Radio' | 'Scissors' | 'ShieldCheck' | 'Shirt' | 'ShoppingBag' | 'Smartphone' | 'Sparkles'
  | 'Tablet' | 'Utensils' | 'UtensilsCrossed' | 'Volume2' | 'Watch' | 'Wrench' | 'Zap';

export interface SubCategory {
  id: string;
  title: string;
  searchQuery: string;
  iconName: SubIconName;
}

export interface ParentCategory {
  id: string;
  title: string;
  iconName: ParentIconName;
  subcategories: SubCategory[];
}

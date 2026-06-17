export interface Cemetery {
  _id?: string;
  name: string;
  location: {
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  address: string;
  city: string;
  country: string;
  description: string;
  image: string;

  // Proprietà calcolate per compatibilità
  lat: number;
  lng: number;
}
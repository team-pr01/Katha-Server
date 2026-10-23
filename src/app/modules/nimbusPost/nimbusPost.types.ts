// src/services/nimbusPost/nimbusPost.types.ts

export interface RateCheckPayload {
  origin: string;
  destination: string;
  payment_method: "cod" | "prepaid";
  order_amount: number;
  weight: number; // in grams
  length: number;
  breadth: number;
  height: number;
}

export interface CreateShipmentPayload {
  order_number: string;
  shipping_charges: number;
  discount: number;
  cod_charges: number;
  payment_method: "cod" | "prepaid";
  order_amount: number;
  package_weight: number;
  package_length: number;
  package_breadth: number;
  package_height: number;
  request_auto_pickup: "yes" | "no";
  consignee: {
    name: string;
    address: string;
    address_2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  pickup: {
    warehouse_name: string;
    name: string;
    address: string;
    address_2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  order_items: {
    name: string;
    qty: number;
    price: number;
    sku: string;
  }[];
}
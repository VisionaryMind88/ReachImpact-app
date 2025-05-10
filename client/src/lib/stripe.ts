import { apiRequest } from "./queryClient";

// Types
export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  credits: number;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

// Create a checkout session for purchasing credits
export async function createCheckoutSession(productId: string): Promise<CheckoutSession> {
  try {
    const response = await apiRequest('POST', '/api/checkout/create-session', { productId });
    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Get available credit packages
export async function getProducts(): Promise<Product[]> {
  try {
    const response = await apiRequest('GET', '/api/products');
    return await response.json();
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

// Get customer's payment methods
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await apiRequest('GET', '/api/payment-methods');
    return await response.json();
  } catch (error) {
    console.error('Error getting payment methods:', error);
    throw error;
  }
}

// Add a payment method
export async function addPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
  try {
    const response = await apiRequest('POST', '/api/payment-methods', { paymentMethodId });
    return await response.json();
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
}

// Remove a payment method
export async function removePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }> {
  try {
    const response = await apiRequest('DELETE', `/api/payment-methods/${paymentMethodId}`);
    return await response.json();
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
}

export default {
  createCheckoutSession,
  getProducts,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
};

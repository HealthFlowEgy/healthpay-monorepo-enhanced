// valu types
export interface ValuEnquiryParams {
  mobileNumber: string;
  productList: ValuProduct[];
}

export interface ValuVerifyCustomerParams {
  mobileNumber: string;
  orderId: string;
}

export interface ValuCustomerStatusParams {
  aggregatorId: string;
  mobileNumber: string;
}
export interface ValuPurchaseParams {
  mobileNumber: string;
  otp: string;
  productList: ValuProductPurchase[];
}

export interface ValuProduct {
  productId: string;
  productPrice: number;
  orderId: string;
  downPayment: number;
  ToUAmount: number;
  CashbackAmount: number;
}
export interface ValuProductPurchase {
  productId: string;
  productPrice: number;
  orderId: string;
  downPayment: number;
  ToUAmount: number;
  CashbackAmount: number;
  tenure: number;
}
// valu types

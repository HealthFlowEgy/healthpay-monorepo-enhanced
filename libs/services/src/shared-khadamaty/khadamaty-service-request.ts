export type serviceField = {
  SFId: string;
  Value: string;
};

export type KhadamatyServicePaymentRequest = {
  serviceFields: serviceField[];
  serviceId: number;
  amount: number;
};

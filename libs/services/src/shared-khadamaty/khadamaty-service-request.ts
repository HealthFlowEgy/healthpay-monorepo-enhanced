type serviceField = {
  SFId: string;
  Value: string;
};

type KhadamatyServicePaymentRequest = {
  serviceFields: serviceField[];
  serviceId: number;
  amount: number;
};

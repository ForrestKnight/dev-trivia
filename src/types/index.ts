export type ResponseObject<T> = {
  statusCode: number;
  data?: T;
  statusString: "OK" | "ERROR";
};
export type Choice = "A" | "B" | "C" | "D";

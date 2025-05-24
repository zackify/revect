export type SendResponse = {
  status?: number;
  headers?: Record<string, string>;
  body: Record<string, any>;
};

export type SendFn = (response: SendResponse) => void | Promise<void>;
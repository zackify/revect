import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { SendFn, SendResponse } from "./types";
import { corsHeaders } from "./corsHeaders";

// Adapter for Bun's Request/Response
export const bunSendAdapter = (res: Response): SendFn => {
  return ({ status = 200, headers = corsHeaders, body }: SendResponse) => {
    return Response.json(body, { status, headers });
  };
};

// Adapter for Express Request/Response
export const expressSendAdapter = (res: ExpressResponse): SendFn => {
  return ({ status = 200, headers = corsHeaders, body }: SendResponse) => {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(status).json(body);
  };
};
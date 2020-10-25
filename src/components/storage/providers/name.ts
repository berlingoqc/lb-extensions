import {Request, Response} from '@loopback/rest';

export type GetFileName = (
  file: string,
  req: Request,
  res?: Response,
) => Promise<string>;
